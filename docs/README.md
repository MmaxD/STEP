---
layout: home
permalink: index.html

# Please update this with your repository name and project title
repository-name: step-school-management
title: STEP School Management System
---

[comment]: # "This is the standard layout for the project, but you can clean this and use your own template, and add more information required for your own project"

<!-- Once you fill the index.json file inside /docs/data, please make sure the syntax is correct. (You can use this tool to identify syntax errors)

Please include the "correct" email address of your supervisors. (You can find them from https://people.ce.pdn.ac.lk/ )

Please include an appropriate cover page image ( cover_page.jpg ) and a thumbnail image ( thumbnail.jpg ) in the same folder as the index.json (i.e., /docs/data ). The cover page image must be cropped to 940×352 and the thumbnail image must be cropped to 640×360 . Use https://croppola.com/ for cropping and https://squoosh.app/ to reduce the file size.

If your followed all the given instructions correctly, your repository will be automatically added to the department's project web site (Update daily)

A HTML template integrated with the given GitHub repository templates, based on github.com/cepdnaclk/eYY-project-theme . If you like to remove this default theme and make your own web page, you can remove the file, docs/_config.yml and create the site using HTML. -->

# STEP School Management System

---

## Team
- E/22/303, Malindu Dinal Rajapaksha, [email](e22303@eng.pdn.ac.lk)
- E/22/296, Miyuru Priyashanka, [email](e22296@eng.pdn.ac.lk)
- E/22/301, Janith Rajakaruna, [email](e22301@eng.pdn.ac.lk)
- E/22/328, Anidu Rathnayaka, [email](e22328@eng.pdn.ac.lk)

<!-- Image (photo/drawing of the final hardware) should be here -->

<!-- This is a sample image, to show how to add images to your page. To learn more options, please refer [this](https://projects.ce.pdn.ac.lk/docs/faq/how-to-add-an-image/) -->

<!-- ![Sample Image](./images/sample.png) -->

#### Table of Contents
- [STEP School Management System](#step-school-management-system)
  - [Team](#team)
      - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Solution Architecture](#solution-architecture)
  - [Software Designs](#software-designs)
    - [Components](#components)
    - [UI Components](#ui-components)
  - [Testing](#testing)
    - [Unit Testing](#unit-testing)
    - [Integration Testing](#integration-testing)
    - [Results](#results)
  - [Conclusion](#conclusion)
  - [Links](#links)

## Introduction

The STEP School Management System is a comprehensive web-based application designed to streamline school administration and academic management. It addresses the challenges of manual record-keeping and communication in educational institutions by providing digital dashboards for students, teachers, principals, and administrators.

The system enables efficient management of student records, grading, class assignments, timetable creation, and user account administration. It aims to improve communication between stakeholders and reduce administrative overhead, ultimately enhancing the educational experience.

## Solution Architecture

The system follows a client-server architecture:

- **Frontend**: Built with React and Vite for fast development and deployment. Styled using Tailwind CSS and custom themes for a responsive user interface.
- **Backend**: Node.js server handling API requests and data management.
- **Database**: Integrated data storage for user accounts, student records, grades, and schedules.

High-level diagram:

<!-- Add architecture diagram here -->

## Software Designs

### Components
- **Authentication**: Login system with role-based access (Student, Teacher, Principal, Admin).
- **Dashboards**: Customized interfaces for different user roles:
  - Student Dashboard: View marks, timetable, placements.
  - Teacher Dashboard: Grading, class management.
  - Principal Dashboard: Overview of school activities.
  - Admin Dashboard: User management, system configuration.
- **Features**:
  - Student Placement
  - Timetable Builder
  - Class Manager
  - Homeroom Management
  - Marks Entry and Grading

### UI Components
Utilizes shadcn/ui components for consistent and accessible design.

## Testing

### Unit Testing
- Component tests using React Testing Library.
- API endpoint tests for the backend server.

### Integration Testing
- End-to-end testing of user workflows, such as login, grading, and timetable creation.

### Results
- All critical features tested and verified.
- Performance benchmarks met for concurrent users.

## Conclusion

The STEP School Management System successfully provides a digital solution for school administration. Key achievements include role-based access control, comprehensive dashboards, and modular component design.

Future developments may include mobile app integration, advanced analytics, and integration with external systems.

Commercialization plans involve offering the system as SaaS for educational institutions.

## Links

- [Project Repository](https://github.com/cepdnaclk/{{ page.repository-name }}){:target="_blank"}
- [Project Page](https://cepdnaclk.github.io/{{ page.repository-name}}){:target="_blank"}
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)

[//]: # (Please refer this to learn more about Markdown syntax)
[//]: # (https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
