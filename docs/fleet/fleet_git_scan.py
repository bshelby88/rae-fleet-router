#!/usr/bin/env python3
"""
Fleet Git Health Scanner — Deep-scan ALL .git folders under OneDrive and nimbus-agent.
Diagnose corruption, object-store integrity, branch/remote state, and recent activity.
Produces a unified report.
"""
import os, subprocess, json, sys
from pathlib import Path

ROOT = Path("C:/Users/Red Roller")
SCOPE = [
    ROOT / "nimbus-agent",
    ROOT / "OneDrive" / "multiAgentic" / "repos",
    ROOT / "OneDrive" / ".recon",
    ROOT / "OneDrive" / "Documents",
]

def run(cmd, cwd=None, timeout=15):
    try:
        r = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "TIMEOUT"
    except Exception as e:
        return -2, "", str(e)

def scan_git_repo(path):
    """Scan a single .git repo for health."""
    p = Path(path)
    if not (p / ".git").is_dir():
        return None
    
    repo_name = p.name
    result = {"repo": str(p), "name": repo_name, "ok": True, "issues": [], "remotes": [], "branches": [], "recent": [], "object_damage": 0}
    
    # Test basic git operations
    code, out, err = run("git status --short", cwd=p, timeout=10)
    if code != 0:
        result["ok"] = False
        result["issues"].append(f"git status failed: {err[:200]}")
    
    # Check object store integrity
    code, out, err = run("git fsck --no-dangling --quiet 2>&1", cwd=p, timeout=30)
    if code != 0:
        result["ok"] = False
        lines = (err + out).strip().split('\n')
        damage = [l for l in lines if 'bad sha1' in l.lower() or 'corrupt' in l.lower() or 'garbage' in l.lower()]
        result["object_damage"] = len(damage)
        if damage:
            result["issues"].append(f"Object store damage: {len(damage)} bad objects")
            result["damage_details"] = damage[:5]
    
    # Count desktop.ini files in objects
    code, out, err = run("find .git/objects -name 'desktop.ini' -type f 2>/dev/null | wc -l", cwd=p, timeout=10)
    if code == 0 and out.strip().isdigit():
        count = int(out.strip())
        if count > 0:
            result["issues"].append(f"Found {count} desktop.ini files in .git/objects/ (Windows/OneDrive corruption)")
            result["object_damage"] = max(result["object_damage"], count)
    
    # Get remotes
    code, out, err = run("git remote -v", cwd=p, timeout=5)
    if code == 0:
        for line in out.strip().split('\n'):
            if line:
                parts = line.split()
                if len(parts) >= 3:
                    result["remotes"].append({"name": parts[0], "url": parts[1], "type": parts[2]})
    
    # Get branches
    code, out, err = run("git branch -a", cwd=p, timeout=5)
    if code == 0:
        for line in out.strip().split('\n'):
            if line.startswith('*') or line.startswith('  '):
                name = line.strip().lstrip('* ').strip()
                if name and not name.startswith('('):
                    result["branches"].append(name)
    
    # Get recent commits (last 3)
    code, out, err = run("git log --oneline --all -3 2>&1", cwd=p, timeout=5)
    if code == 0 and out.strip():
        for line in out.strip().split('\n'):
            if line:
                result["recent"].append(line)
    elif code != 0:
        result["issues"].append(f"git log failed: {err[:200]}")
    
    # Count commits
    code, out, err = run("git rev-list --count HEAD 2>&1", cwd=p, timeout=5)
    if code == 0 and out.strip().isdigit():
        result["commit_count"] = int(out.strip())
    
    # Largest objects
    code, out, err = run("git count-objects -v 2>&1", cwd=p, timeout=10)
    if code == 0:
        for line in out.strip().split('\n'):
            if 'count:' in line.lower() or 'size:' in line.lower() or 'in-pack:' in line.lower():
                result.setdefault("object_stats", {})[line.split(':')[0].strip()] = line.split(':', 1)[1].strip() if ':' in line else ""
    
    return result

def scan_all():
    """Find all .git dirs and scan them."""
    git_dirs = []
    
    for base in SCOPE:
        if not base.exists():
            continue
        print(f"Scanning {base}...", file=sys.stderr)
        for root, dirs, files in os.walk(base):
            # Skip node_modules, .git itself is the target
            if 'node_modules' in root or '__pycache__' in root:
                dirs.clear()
                continue
            if '.git' in dirs:
                git_dir = Path(root) / '.git'
                # Get the repo root (parent of .git)
                repo_root = Path(root)
                git_dirs.append(repo_root)
                dirs.clear()  # Don't recurse into .git
    
    print(f"Found {len(git_dirs)} repos total", file=sys.stderr)
    
    results = []
    for repo in sorted(git_dirs, key=lambda p: str(p)):
        print(f"  Scanning {repo.name}...", file=sys.stderr)
        r = scan_git_repo(repo)
        if r:
            results.append(r)
    
    return results

def main():
    results = scan_all()
    
    # Categorize
    healthy = [r for r in results if r["ok"] and r.get("object_damage", 0) == 0]
    damaged = [r for r in results if not r["ok"] or r.get("object_damage", 0) > 0]
    with_remotes = [r for r in results if r.get("remotes")]
    local_only = [r for r in results if r.get("remotes") == []]
    
    print("\n" + "="*80)
    print("FLEET GIT HEALTH REPORT")
    print("="*80)
    print(f"\nTotal repos scanned: {len(results)}")
    print(f"  Healthy (no object corruption): {len(healthy)}")
    print(f"  Damaged (object corruption or errors): {len(damaged)}")
    print(f"  With GitHub remotes: {len(with_remotes)}")
    print(f"  Local-only (no remote): {len(local_only)}")
    
    print("\n" + "-"*80)
    print("REPOS WITH GITHUB REMOTES (deployable)")
    print("-"*80)
    for r in sorted(with_remotes, key=lambda x: x["name"]):
        print(f"\n📦 {r['name']}")
        print(f"   Path: {r['repo']}")
        for rem in r["remotes"]:
            print(f"   Remote: {rem['name']} -> {rem['url']} ({rem['type']})")
        if r.get("recent"):
            print(f"   Latest commits:")
            for c in r["recent"][:3]:
                print(f"     {c}")
        if r.get("commit_count"):
            print(f"   Total commits: {r['commit_count']:,}")
        if r.get("object_damage", 0) > 0:
            print(f"   ⚠ OBJECT DAMAGE: {r['object_damage']}")
            if "damage_details" in r:
                for d in r["damage_details"]:
                    print(f"     {d}")
    
    print("\n" + "-"*80)
    print("REPOS WITH NO REMOTE (local-only)")
    print("-"*80)
    for r in sorted(local_only, key=lambda x: x["name"]):
        print(f"\n📦 {r['name']}")
        print(f"   Path: {r['repo']}")
        if r.get("recent"):
            for c in r["recent"][:3]:
                print(f"     {c}")
        if r.get("branches"):
            print(f"   Branches: {', '.join(r['branches'][:5])}")
        if r.get("object_damage", 0) > 0:
            print(f"   ⚠ OBJECT DAMAGE: {r['object_damage']}")
    
    print("\n" + "-"*80)
    print("REPOS WITH OBJECT STORE CORRUPTION")
    print("-"*80)
    for r in sorted(damaged, key=lambda x: -x.get("object_damage", 0)):
        print(f"\n💥 {r['name']} — DAMAGE: {r.get('object_damage', 0)}")
        print(f"   Path: {r['repo']}")
        for issue in r.get("issues", []):
            print(f"   • {issue}")
        if r.get("damage_details"):
            for d in r["damage_details"]:
                print(f"     {d}")
    
    print("\n" + "-"*80)
    print("ALL REPOS SUMMARY")
    print("-"*80)
    for r in sorted(results, key=lambda x: x["name"]):
        status = "✅" if r["ok"] and r.get("object_damage", 0) == 0 else "💥"
        remote = "🔗" if r.get("remotes") else "📁"
        print(f"{status} {remote} {r['name']}: {r.get('commit_count', '?')} commits | damage={r.get('object_damage', 0)} | issues={len(r.get('issues', []))}")
    
    # Save full JSON
    report_path = ROOT / "fleet-git-health-report.json"
    with open(report_path, 'w') as f:
        json.dump({"summary": {"total": len(results), "healthy": len(healthy), "damaged": len(damaged), "with_remotes": len(with_remotes), "local_only": len(local_only)}, "repos": results}, f, indent=2)
    print(f"\n📄 Full report saved to: {report_path}")
    
    return damaged

if __name__ == "__main__":
    damaged = main()
    sys.exit(0 if not damaged else 1)
