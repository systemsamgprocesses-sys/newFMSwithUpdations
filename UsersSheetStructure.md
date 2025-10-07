# 📘 Task Management Sheets

This document describes the structure and sample data for the **Task Management System**, maintained in Google Sheets.  
It includes three sheets:

1. **CREDENTIALS**
2. **SCORING**
3. **MASTER**

---

## 🔐 Sheet 1: CREDENTIALS

| User ID | Password | Departments |
|----------|-----------|-------------|
| Ajay Kumar Jha | Ajay@123 | ACCOUNTS |
| Akanksha Jaggi | Akanksha@123 | LEASING |
| Amardeep Singh Bains | Amardeep@123 | LEASING |
| Amit Kumar | Amit@123 | MALL OPERATIONS |
| Ashok Malhotra | Ashok@123 | MANAGEMENT |

---

## 🧮 Sheet 2: SCORING

| Task Id | GIVEN BY | GIVEN TO | GIVEN TO USER ID | TASK DESCRIPTION | HOW TO DO - TUTORIAL LINKS (OPTIONAL) | DEPARTMENT | TASK FREQUENCY | PLANNED DATE | Task Status | Revision Date | Reason for Revision | completed on | BLANK | BLANK | BLANK | Revision Status & Log | Revision Count | Scoring Impact | On time or not? | Scoring |
|----------|-----------|-----------|------------------|------------------|--------------------------------------|-------------|----------------|---------------|--------------|----------------|---------------------|---------------|--------|--------|--------|------------------------|----------------|----------------|-----------------|----------|
| AT-1 | MD | AJAY KUMAR JHA | Ajay Kumar Jha | Provisional Balance Sheet |  | ACCOUNTS | One Time Only | 01/09/2025 | Completed |  |  | 01/09/2025 |  |  |  |  |  |  | On Time | 1 |
| AT-2 | MD | AJAY KUMAR JHA | Ajay Kumar Jha | Final Balance Sheet |  | ACCOUNTS | One Time Only | 30/09/2025 | Completed |  |  | 01/10/2025 |  |  |  |  |  |  | Not On Time | 0 |
| AT-3 | MD | PRATIBHA BEDI | Pratibha Bedi | Final Balance Sheet |  | ACCOUNTS | One Time Only | 30/09/2025 | Completed |  |  | 30/09/2025 |  |  |  |  |  |  | On Time | 1 |
| AT-4 | MD | AJAY KUMAR JHA | Ajay Kumar Jha | GST Return- R1 (Sales) | GST Return- R1 | ACCOUNTS | MONTHLY | 09/09/2025 | Completed |  |  | 09/09/2025 |  |  |  |  |  |  | On Time | 1 |

---

## 📋 Sheet 3: MASTER

| Task Id | GIVEN BY | GIVEN TO | GIVEN TO USER ID | TASK DESCRIPTION | HOW TO DO - TUTORIAL LINKS (OPTIONAL) | DEPARTMENT | TASK FREQUENCY | PLANNED DATE | Task Status | Revision Date | Reason for Revision | completed on | Revision Status | Revision 1 Date | Revision 2 Date | Revision Status & Log | Revision Count | Scoring Impact | On time or not? |
|----------|-----------|-----------|------------------|------------------|--------------------------------------|-------------|----------------|---------------|--------------|----------------|---------------------|---------------|-----------------|-----------------|------------------------|----------------|----------------|-----------------|
| AT-1 | MD | AJAY KUMAR JHA | Ajay Kumar Jha | Provisional Balance Sheet |  | ACCOUNTS | One Time Only | 01/09/2025 | Completed |  |  | 01/09/2025 |  |  |  |  |  |  | On Time |
| AT-2 | MD | AJAY KUMAR JHA | Ajay Kumar Jha | Final Balance Sheet |  | ACCOUNTS | One Time Only | 30/09/2025 | Completed |  |  | 01/10/2025 |  |  |  |  |  |  | Not On Time |
| AT-3 | MD | PRATIBHA BEDI | Pratibha Bedi | Final Balance Sheet |  | ACCOUNTS | One Time Only | 30/09/2025 | Completed |  |  | 30/09/2025 |  |  |  |  |  |  | On Time |
| AT-4 | MD | AJAY KUMAR JHA | Ajay Kumar Jha | GST Return- R1 (Sales) | GST Return- R1 | ACCOUNTS | MONTHLY | 09/09/2025 | Completed |  |  | 09/09/2025 |  |  |  |  |  |  | On Time |

---

### ✅ Notes

- **CREDENTIALS Sheet** stores user authentication and department mapping.  
- **SCORING Sheet** includes performance metrics such as “On time or not?” and “Scoring.”  
- **MASTER Sheet** tracks task lifecycle, revisions, and completion dates.  
- Columns labeled **BLANK** are reserved for future data or internal formulas.  

---

### 🧠 Usage Guide

- Used as backend data for **Google Apps Script-based Task Management System (FMS)**.  
- Helps automate **task allocation**, **performance tracking**, and **revision logging**.  
- The **PLANNED DATE** vs **completed on** columns allow time-based scoring.  

---

**Author:** Task Management System  
**Version:** 1.0  
**Last Updated:** 06 October 2025
