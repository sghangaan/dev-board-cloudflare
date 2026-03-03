# Security Guidelines

This document outlines security best practices for this Cloudflare Workers project.

## 🔒 Protected Files (Gitignored)

The following files contain sensitive information and are **automatically excluded** from git:

### Configuration Files
- `workers/**/wrangler.jsonc` - Contains database IDs, KV namespace IDs, and bucket names
- `.env.local` - Local environment variables
- `.env*.local` - Any local environment files

### Build Artifacts
- `.wrangler/` - Cloudflare Wrangler build cache and temporary files
- `.claude/` - Claude Code editor configuration

## ✅ Safe to Commit

These files are safe to commit to public repositories:

- `workers/**/wrangler.jsonc.example` - Template files with placeholders
- `.env.example` - Example environment variables
- All source code files (`.js`, `.jsx`, `.ts`, `.tsx`)
- README files
- Configuration without credentials

## 🚨 What NOT to Commit

**Never commit these to a public repository:**

1. **Cloudflare Resource IDs:**
   - D1 Database IDs
   - KV Namespace IDs
   - R2 Bucket names (if they contain sensitive info)
   - Account IDs

2. **API Keys & Secrets:**
   - Cloudflare API tokens
   - R2 access keys and secret keys
   - Any third-party API keys
   - Authentication tokens

3. **Environment Variables:**
   - `.env.local` files
   - Any file with actual credentials

## 🛡️ Before Pushing to GitHub

**Always run this checklist before `git push`:**

- [ ] Check `git status` - ensure no `.env.local` or `wrangler.jsonc` files are staged
- [ ] Run `git diff --cached` - review all staged changes for secrets
- [ ] Verify `.gitignore` is working - `wrangler.jsonc` should not appear in `git status`
- [ ] Search for hardcoded secrets: `grep -r "api_key\|secret\|password" --exclude-dir=node_modules`

## 🔍 How to Check for Exposed Secrets

```bash
# Check what will be committed
git status

# Review staged changes line by line
git diff --cached

# Search for potential secrets in tracked files
git grep -i "api.*key\|secret\|password\|token" -- "*.js" "*.ts" "*.jsx" "*.tsx"

# List all files that will be committed
git ls-files
```

## 🚀 Safe Deployment Workflow

1. **Local Development:**
   ```bash
   # Copy example configs
   cp wrangler.jsonc.example wrangler.jsonc
   cp .env.example .env.local

   # Add your credentials to wrangler.jsonc and .env.local
   # These files are gitignored
   ```

2. **Testing:**
   ```bash
   # Test locally
   wrangler dev

   # Test with actual resources
   wrangler deploy --dry-run
   ```

3. **Deployment:**
   ```bash
   # Deploy from local config (wrangler.jsonc is used but not committed)
   wrangler deploy
   ```

4. **Committing Code:**
   ```bash
   # Only commit source code and templates
   git add app/ workers/**/*.example README.md
   git commit -m "Your message"
   git push
   ```

## 📝 Creating New Workers

When adding a new worker:

1. Create the worker code
2. Create `wrangler.jsonc` locally with your credentials
3. Create `wrangler.jsonc.example` with placeholders
4. Document setup in worker's README.md
5. Only commit the `.example` file

## 🔑 Managing Secrets

For API keys and sensitive values:

```bash
# Store secrets using Wrangler (not in files)
wrangler secret put SECRET_NAME

# Access in worker code
env.SECRET_NAME
```

Never store secrets in:
- Environment variables in `wrangler.jsonc`
- Source code files
- `.env` files that might be committed

## 🚨 What to Do If You Accidentally Commit Secrets

1. **Rotate the exposed credentials immediately**
2. **Remove from git history:**
   ```bash
   # Use git-filter-repo or BFG Repo-Cleaner
   git filter-repo --path path/to/sensitive/file --invert-paths
   ```
3. **Force push (if you're the only one using the repo):**
   ```bash
   git push origin --force --all
   ```
4. **Create new credentials in Cloudflare Dashboard**

## 📚 Resources

- [Cloudflare Security Best Practices](https://developers.cloudflare.com/workers/platform/security/)
- [Managing Secrets in Workers](https://developers.cloudflare.com/workers/configuration/secrets/)
- [git-secrets Tool](https://github.com/awslabs/git-secrets)
