-- Create Hospital Branch Table
CREATE TABLE HOSPITAL_BRANCH (
    Branch_ID SERIAL PRIMARY KEY,
    Branch_Name VARCHAR(150) NOT NULL,
    Location_City VARCHAR(100) NOT NULL,
    Emergency_Capacity INT
);

-- Create Patient Table
CREATE TABLE PATIENT (
    Patient_ID SERIAL PRIMARY KEY,
    First_Name VARCHAR(100) NOT NULL,
    Last_Name VARCHAR(100) NOT NULL,
    Date_Of_Birth DATE NOT NULL
);

-- Create Staff Table
CREATE TABLE STAFF (
    Staff_ID SERIAL PRIMARY KEY,
    First_Name VARCHAR(100) NOT NULL,
    Last_Name VARCHAR(100) NOT NULL,
    Medical_Role VARCHAR(100) NOT NULL,
    License_Number VARCHAR(50) UNIQUE NOT NULL
);