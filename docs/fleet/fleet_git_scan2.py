#!/usr/bin/env python3
"""Fleet Git Health Scanner — targeted scan of all .git folders."""
import os, subprocess, json, sys
from pathlib import Path

ROOT = Path("C:/Users/Red Roller")

def run(cmd, cwd=None, timeout=15):
    try:
        r = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, r.stdout, r.stderr
    except:
        return -1, "", "ERROR"

def scan_git_repo(path):
    p = Path(path)
    if not (p / ".git").is_dir():
        return None
    repo_name = p.name
    result = {"repo": str(p), "name": repo_name, "ok": True, "issues": [], "remotes": [], "branches": [], "recent": [], "object_damage": 0, "commit_count": 0}
    
    code, out, err = run("git status --short", cwd=p, timeout=10)
    if code != 0:
        result["ok"] = False
        result["issues"].append(f"git status: {err[:200]}")
    
    code, out, err = run("git fsck --no-dangling --quiet 2>&1", cwd=p, timeout=60)
    if code != 0:
        result["ok"] = False
        lines = (err + out).strip().split('\n')
        damage = [l for l in lines if 'bad sha1' in l.lower() or 'corrupt' in l.lower() or 'garbage' in l.lower()]
        result["object_damage"] = len(damage)
        if damage:
            result["issues"].append(f"Object store: {len(damage)} bad objects")
            result["damage_details"] = damage[:3]
    
    code, out, err = run("find .git/objects -name 'desktop.ini' -type f 2>/dev/null | wc -l", cwd=p, timeout=10)
    if code == 0 and out.strip().isdigit():
        count = int(out.strip())
        if count > 0:
            result["issues"].append(f"{count} desktop.ini files in .git/objects/")
            result["object_damage"] = max(result["object_damage"], count)
    
    code, out, err = run("git remote -v", cwd=p, timeout=5)
    if code == 0:
        for line in out.strip().split('\n'):
            if line:
                parts = line.split()
                if len(parts) >= 3:
                    result["remotes"].append({"name": parts[0], "url": parts[1], "type": parts[2]})
    
    code, out, err = run("git branch -a", cwd=p, timeout=5)
    if code == 0:
        for line in out.strip().split('\n'):
            if line.strip():
                name = line.strip().lstrip('* ').strip()
                if name and not name.startswith('('):
                    result["branches"].append(name)
    
    code, out, err = run("git log --oneline --all -3 2>&1", cwd=p, timeout=10)
    if code == 0 and out.strip():
        for line in out.strip().split('\n'):
            if line: result["recent"].append(line)
    elif code != 0:
        result["issues"].append(f"git log: {err[:150]}")
    
    code, out, err = run("git rev-list --count HEAD 2>&1", cwd=p, timeout=5)
    if code == 0 and out.strip().isdigit():
        result["commit_count"] = int(out.strip())
    
    return result

def main():
    git_dirs = []
    bases = [ROOT / "nimbus-agent", ROOT / "OneDrive" / "multiAgentic" / "repos"]
    
    for base in bases:
        if not base.exists(): continue
        for root, dirs, files in os.walk(base):
            if 'node_modules' in root or '__pycache__' in root:
                dirs.clear()
                continue
            if '.git' in dirs:
                repo_root = Path(root)
                git_dirs.append(repo_root)
                dirs.clear()
    
    results = []
    for repo in sorted(git_dirs, key=lambda p: str(p)):
        r = scan_git_repo(repo)
        if r: results.append(r)
        print(f"Scanned: {repo.name}", file=sys.stderr)
    
    healthy = [r for r in results if r["ok"] and r.get("object_damage", 0) == 0]
    damaged = [r for r in results if not r["ok"] or r.get("object_damage", 0) > 0]
    with_remotes = [r for r in results if r.get("remotes")]
    local_only = [r for r in results if r.get("remotes") == []]
    no_log = [r for r in results if not r.get("recent")]
    
    report = {
        "summary": {"total": len(results), "healthy": len(healthy), "damaged": len(damaged), "with_remotes": len(with_remotes), "local_only": len(local_only), "no_log": len(no_log)},
        "repos": results
    }
    
    # Write JSON
    out_path = ROOT / "fleet-git-health-report.json"
    with open(out_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    # Print summary
    print(f"\nTotal repos: {len(results)}")
    print(f"Healthy: {len(healthy)}")
    print(f"Damaged: {len(damaged)}")
    print(f"With remotes: {len(with_remotes)}")
    print(f"Local-only: {len(local_only)}")
    print(f"No log: {len(no_log)}")
    
    for r in sorted(results, key=lambda x: x["name"]):
        status = "OK" if r["ok"] and r.get("object_damage", 0) == 0 else "DAMAGED"
        remote = "REMOTE" if r.get("remotes") else "LOCAL"
        print(f"{status} {remote} {r['name']}: {r.get('commit_count', '?')} commits | damage={r.get('object_damage', 0)}")
    
    return report

if __name__ == "__main__":
    main()
