---
title: API Testing
published: 2025-07-01
description: Exploring securing JSON/REST APIs, covering reconnaissance, endpoint testing, hidden parameter discovery, and vulnerability mitigation with practical examples.
tags: [API Security, JSON, REST, Burp Suite, OWASP, Cybersecurity, Web Security]
category: Article
draft: false
---

## Overview

This article covers techniques for testing JSON/REST APIs to identify and mitigate vulnerabilities. It provides practical examples to help secure and exploring APIs effectively.

## API Recon

**Objective:**  
Discover endpoints, their structure, and supported methods.

**Techniques:**
- Intercept traffic using tools like Burp Suite.
- Scan JavaScript files for URLs.
- Explore directories such as:
  - `/api/`
  - `/swagger/`
  - `/openapi.json`

**Example:**
```http
GET /api/books HTTP/1.1
```
- Analyze the response to identify fields, authentication, and data structure.

## Discovering API Documentation

**Objective:**  
Locate exposed documentation revealing API structure and usage.

**Where to Look:**
- `/swagger/index.html`
- `/api-docs/`
- `/openapi.json`

**Tools:**
- Burp Scanner
- Dirsearch or ffuf
- Postman or Swagger UI

## Identifying and Interacting with Endpoints

**Objective:**  
Determine supported methods and endpoint behavior.

**Testing Approach:**
- Send GET, POST, PUT, PATCH, DELETE requests using tools like Burp Repeater.
- Modify `Content-Type` to XML, JSON, or invalid types.
- Verify permissions, headers, and responses.

**Example:**
```http
PATCH /api/users/123 HTTP/1.1
Content-Type: application/json
{
  "isAdmin": true
}
```
- If accepted, indicates potential privilege escalation via mass assignment.

## Finding Hidden Parameters

**Tools:**
- Burp Intruder with wordlists
- Param Miner
- Burp Logger++ or Logger for Burp

**What to Look For:**
- Parameters like `role`, `isAdmin`, `org`, `status`.
- Fields not visible in the frontend but impacting backend logic.

## Server-Side Parameter Pollution (SSPP)

**Test:**
```http
GET /search?query=foo&query=bar
```

**Possible Behaviors:**
- **PHP:** Uses the last value.
- **Node.js/Express:** Uses the first value.
- **ASP.NET:** Concatenates both.
- This can manipulate filters, searches, or server logic.

## Preventing Vulnerabilities 

- Restrict unused HTTP methods (use whitelists).
- Validate `Content-Type` and incoming data.
- Use generic error messages.
- Protect sensitive attributes (`isAdmin`, `role`) from mass assignment.
- Secure all API versions (e.g., `v1`, `v2`).

## Wrapping It Up

Testing APIs is like playing a high-stakes game of cat and mouse you’re hunting for cracks before the bad guys do. This guide lays out the moves: start by mapping endpoints with Burp Suite, dig up documentation to get the full picture, poke at methods to find weak spots, uncover hidden parameters, mess with the server using SSPP, and then lock everything down tight.
