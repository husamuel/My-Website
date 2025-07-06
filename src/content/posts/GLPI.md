---
title: Building a Ticket System Environment with GLPI
published: 2025-06-23  
description: A hands-on walkthrough of installing, configuring, and using GLPI to simulate real-world helpdesk workflows, including user roles, ticket management, and dashboard reporting.  
tags: [GLPI, Helpdesk, ITSM, Ticketing System, Docker, Support Workflow]  
category: Projects  
draft: false  
---


# Practical Lab: My First Experience with GLPI (Helpdesk System)

This was my first hands-on encounter with a ticketing management system. I chose GLPI, a widely used open-source tool in IT environments. Below, I outline step-by-step what I did and how I configured the system to simulate a real technical support scenario.

## 1. Environment Installation

I opted to use Docker to simplify the installation and isolate the environment:

- Configured `docker-compose` with GLPI and MariaDB containers.
- After starting the services, accessed the system at `http://localhost:8080`.
- Logged in with the default credentials: `glpi` / `glpi`.
- Performed initial setup, defining the language, time zone, and organization name.

In just a few minutes, I had the system up and running, ready for testing.

## 2. Support Simulation

I set up a basic technical support scenario to understand the workflow:

- Created a requester user with the "Self-service" profile.
- Created a technician user with the "Technician" profile.

Practical test of a ticket:

- Logged in as the requester and opened a ticket titled: “Printer issue”.
- Then, logged in as the technician:
  - Assigned the ticket to myself.
  - Added comments simulating a diagnosis.
  - Recorded a solution for the issue.
  - Finalized the ticket by marking it as resolved.

This process helped me understand the full ticket lifecycle: from opening to resolution.

## 3. Profiles, Permissions, and Groups

I explored the user management and access control features:

- Created two custom profiles: Level 1 and Supervisor, with different permissions.
- Adjusted the actions each profile could perform within the system.
- Created user groups and assigned profiles according to each member's role.
- Tested access by simulating different support team functions.

This allowed me to see how GLPI separates responsibilities between technical and administrative team members.

## 4. Reports and Indicators

I also explored the analysis and monitoring features:

- Accessed the system's main dashboard.
- Generated reports on tickets by status, responsible technician, and category.
- Evaluated the data to understand how the system displays key operational indicators (e.g., ticket volume and resolution time).

This part was helpful in realizing how GLPI can enhance support management strategically.

## What I learned

This experience was crucial for understanding, in a practical way, how a professional helpdesk system works. With GLPI, I managed to:

- Set up a functional environment from scratch using Docker.
- Simulate real support scenarios.
- Test different profiles and access levels.
- Use reports to visualize operations.

It was a significant learning experience, both technically and conceptually, and provided a solid foundation for working with ticketing systems in daily team settings.