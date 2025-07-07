---
title: AWS Infrastructure Automation with Terraform and Ansible
published: 2025-07-06
description: A practical project for provisioning and automating EC2 server configuration on AWS using Terraform for infrastructure and Ansible for configuration management.
tags: [AWS, Terraform, Ansible, IaaS, Automation, DevOps, Nginx]
category: Projects
draft: false
---


## Introduction

In this project I wanted to learn in practice how to build an automated infrastructure on AWS using Terraform to provision resources and Ansible to configure servers. The goal was to provision an EC2 instance running Nginx, with the entire process orchestrated through code.

Look the [códe](https://github.com/husamuel/My-Website)

## Project Objectives

- Learn how to provision AWS infrastructure using Terraform modules
- Gain hands-on experience automating server setup with Ansible
- Understand how to integrate Terraform and Ansible for efficient infrastructure management
- Learn how to provision AWS infrastructure using Terraform modules

## Project Structure

The project was organized as follows:

```
terraform-project/
├── ansible/
│   ├── inventory.ini         # Ansible inventory with EC2 IP
│   └── playbook.yml          # Ansible playbook to configure the server
├── run-ansible.sh            # Script to run Ansible
└── terraform/
    ├── main.tf               # Main Terraform code
    ├── variables.tf          # Terraform variables
    ├── outputs.tf            # Outputs like instance IP
    ├── provider.tf           # AWS provider configuration
    └── modules/              # Modules for EC2, VPC, and S3
        ├── ec2/
        ├── s3/
        └── vpc/
```

## AWS Provider

```hcl
provider "aws" {
  region = "us-east-1"
}
```

This block configures the AWS provider and specifies the region where resources will be created. Choosing the right region is critical for latency, cost, and compliance considerations.

File: `modules/vpc/main.tf`

## VPC and Networking

A Virtual Private Cloud (VPC) is a private network in AWS where all resources reside.

```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}
```

- **CIDR Block**: Defines the range of private IP addresses.
- **DNS Support and Hostnames**: Enables the use of domain names instead of IP addresses.

To enable internet connectivity, a public subnet is created:

```hcl
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
}
```

- The `map_public_ip_on_launch` flag ensures that instances launched in this subnet automatically receive a public IP for external communication.

An Internet Gateway and Route Table are also created to route traffic outside the VPC:

```hcl
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}
```

These components are essential to allow the EC2 instance to access and be accessed from the internet.

## Security: Security Group

File: `modules/ec2/main.tf`

```hcl
resource "aws_security_group" "web_sg" {
  vpc_id = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = -1
    to_port     = -1
    protocol    = "icmp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

- Allows SSH access (port 22) from anywhere to manage the server.
- Permits ICMP (ping) for connectivity checks.
- Allows all outbound traffic.

This security group is applied to the EC2 instance to ensure necessary access while keeping unnecessary ports closed.

## EC2 Instance

File: `modules/ec2/main.tf`

```hcl
resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  subnet_id              = var.public_subnet_id
  vpc_security_group_ids = [aws_security_group.web_sg.id]
  key_name               = aws_key_pair.deployer.key_name

  tags = {
    Name = "Terraform-Web"
  }
}
```

- The instance uses an automatically updated Amazon Linux 2 AMI.
- It is placed in the public subnet with a public IP for external access.
- Uses a key pair for secure SSH connections.
- Tags help identify the instance in the AWS console.

## SSH Key Pair

```hcl
resource "aws_key_pair" "deployer" {
  key_name   = "hugo-key"
  public_key = file("~/.ssh/hugo-key.pub")
}
```

This resource imports your public SSH key to enable secure authentication, essential for accessing the instance without passwords.

## S3 Bucket

File: `modules/s3/main.tf`

```hcl
resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name

  tags = {
    Name = var.bucket_name
  }
}
```

An S3 bucket can be used for external storage, backups, or application logs, integrating the infrastructure with scalable cloud storage.

## How to Execute

1. Initialize Terraform to download plugins and prepare the environment:

```bash
terraform init
```

2. Apply the plan to create the resources:

```bash
terraform apply
```

Upon completion, you will see the public IP of the instance, which can be used for SSH connections and to run Ansible for further machine configuration.

## Configuring the Server with Ansible

### Inventory (`ansible/inventory.ini`)

```ini
[web]
54.159.216.120 ansible_user=ec2-user ansible_ssh_private_key_file=~/.ssh/hugo-key ansible_python_interpreter=/usr/bin/python3
```

- Defines the host with the public IP
- Uses the default `ec2-user` user
- Specifies the SSH key for connection
- Sets the Python 3 interpreter, essential to avoid Ansible errors

### Playbook (`ansible/playbook.yml`)

```yaml
---
- name: Configure EC2 server
  hosts: web
  become: true

  tasks:
    - name: Update packages
      yum:
        name: '*'
        state: latest

    - name: Install nginx
      yum:
        name: nginx
        state: present

    - name: Start and enable nginx
      service:
        name: nginx
        state: started
        enabled: true
```

This playbook:

- Updates all packages to the latest version
- Installs the Nginx web server
- Ensures the service is running and starts with the system

### Running Ansible

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml
```

## Challenges that I faced

During the project, I faced some common challenges. One of them was the inability to connect via SSH due to the Security Group rules, which did not allow access via port 22. I fixed this by adjusting the rules to allow access.

Another issue was the use of Python 2 by default in the instance, which caused Ansible to fail. To resolve this, I installed Python 3 and configured Ansible to use the correct interpreter.

These difficulties reinforced the importance of correctly configuring the remote environment so that automation works smoothly.

