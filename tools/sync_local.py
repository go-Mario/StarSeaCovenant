#!/usr/bin/env python3
"""Generate and copy the same HTML to both local filenames, with backups."""
import argparse
import hashlib
import shutil
import tempfile
from pathlib import Path
from build import build, ROOT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", type=Path, help="Folder holding the two local HTML files")
    args = parser.parse_args()
    target = args.target.resolve(strict=True)
    names = ["index.html", "星海公约-仲裁庭-v3-法庭剧场.html"]
    files = [target / name for name in names]
    if any(p.is_symlink() for p in files):
        raise SystemExit("Refusing to overwrite symbolic links.")
    data = build()
    portable = ROOT / "dist/starsea.html"
    if not portable.exists() or portable.read_bytes() != data:
        raise SystemExit("Build the portable HTML first: python3 tools/build.py")
    backup = Path(tempfile.mkdtemp(prefix="星海公约-同步前备份-", dir=target))
    existed = {p: p.exists() for p in files}
    for p in files:
        if existed[p]:
            shutil.copy2(p, backup / p.name)
    temps = []
    try:
        for p in files:
            with tempfile.NamedTemporaryFile(dir=target, suffix=".html", delete=False) as f:
                f.write(data)
                temps.append(Path(f.name))
        for p, tmp in zip(files, temps):
            tmp.replace(p)
        assert all(p.read_bytes() == data for p in files)
    except Exception:
        for p in files:
            if existed[p]:
                shutil.copy2(backup / p.name, p)
            elif p.exists():
                p.unlink()
        raise
    finally:
        for tmp in temps:
            tmp.unlink(missing_ok=True)
    print("Backup:", backup)
    print("Both local files match the portable build generated from repository sources.")
    print("SHA-256:", hashlib.sha256(data).hexdigest())


if __name__ == "__main__":
    main()
