const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors()); // Allows React to talk to this server
app.use(express.json()); // Allows sending JSON data

// 1. Database Connection

// 1. Create a Pool instead of a single connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true, // Crucial for cloud databases
    keepAliveInitialDelay: 10000
});

// 2. Test the connection
db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to Online MySQL Database Pool!");
        connection.release(); // Send it back to the pool
    }
});
// db.connect(err => {
//     if (err) {
//         console.error('Error connecting to MySQL:', err);
//     } else {
//         console.log('Connected to MySQL Database');
//     }
// });

// 2. API Endpoints

// GET: Fetch all students
app.get('/students', (req, res) => {
    const sql = "SELECT * FROM students";
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

// POST: Add a new student
app.post('/students', (req, res) => {
    const sql = "INSERT INTO students (`name`, `email`, `enrolled_class`, `status`) VALUES (?)";
    const values = [
        req.body.name,
        req.body.email,
        req.body.enrolledClass, // Note: Matches React state name
        req.body.status
    ];
    db.query(sql, [values], (err, data) => {
        if (err) return res.json(err);
        return res.json("Student has been created successfully.");
    });
});

// PUT: Update a student
app.put('/students/:id', (req, res) => {
    const id = req.params.id;
    const sql = "UPDATE students SET `name`= ?, `email`= ?, `enrolled_class`= ?, `status`= ? WHERE id = ?";
    const values = [
        req.body.name,
        req.body.email,
        req.body.enrolledClass,
        req.body.status
    ];
    db.query(sql, [...values, id], (err, data) => {
        if (err) return res.json(err);
        return res.json("Student updated successfully.");
    });
});

// DELETE: Remove a student
app.delete('/students/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM students WHERE id = ?";
    db.query(sql, [id], (err, data) => {
        if (err) return res.json(err);
        return res.json("Student deleted successfully.");
    });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
// GET: Fetch Dashboard Data for a specific Student
// DEBUGGING VERSION of the Dashboard Endpoint
// GET: Fetch Dashboard Data (Crash-Proof Version)
app.get('/student-dashboard/:id', (req, res) => {
    const studentId = req.params.id;
    const responseData = {};

    // 1. Get Basic Profile
    db.query("SELECT * FROM students WHERE id = ?", [studentId], (err, result) => {
        if (err) return res.status(500).json(err); // Return immediately on error
        if (result.length === 0) return res.status(404).json("Student not found");
        
        responseData.profile = result[0];
        const studentClass = result[0].enrolled_class || ""; // Handle empty class

        // 2. Get Class Teacher
        db.query("SELECT * FROM teachers WHERE assigned_class = ?", [studentClass], (err, teacherResult) => {
            if (err) {
                console.log("Teacher table error (skipping teacher data):", err.message);
                responseData.teacher = null; // Don't crash, just skip teacher data
            } else {
                responseData.teacher = teacherResult.length > 0 ? teacherResult[0] : null;
            }

            // 3. Get GPA History
            db.query("SELECT semester, gpa FROM student_gpa_history WHERE student_id = ?", [studentId], (err, gpaResult) => {
                if (err) {
                    console.log("GPA table error:", err.message);
                    responseData.gpaHistory = []; 
                } else {
                    responseData.gpaHistory = gpaResult;
                }

                // 4. Get Subject Strengths
                db.query("SELECT subject, score FROM student_subjects WHERE student_id = ?", [studentId], (err, subResult) => {
                    if (err) {
                        console.log("Subjects table error:", err.message);
                        responseData.subjects = [];
                    } else {
                        responseData.subjects = subResult;
                    }

                    // 5. Get Focus Areas
                    db.query("SELECT topic, confidence, priority FROM student_focus_areas WHERE student_id = ?", [studentId], (err, focusResult) => {
                        if (err) {
                            console.log("Focus Areas table error:", err.message);
                            responseData.focusAreas = [];
                        } else {
                            responseData.focusAreas = focusResult;
                        }

                        // Send whatever data we managed to collect
                        res.json(responseData);
                    });
                });
            });
        });
    });
});


// ... existing imports ...

// 1. GET: Fetch Homeroom Data (Students + Today's Attendance + Stats)
app.get('/homeroom/:classId', (req, res) => {
    const classId = req.params.classId; // e.g., "Grade 11-A"
    const date = req.query.date || new Date().toISOString().split('T')[0]; // Default to today

    // Complex Query: Get Students + Their Status for specific Date + Attendance Rate Calculation
    const sql = `
        SELECT 
            s.id, 
            s.name, 
            s.email, 
            s.id as studentId, -- Using DB ID as StudentID for display
            a.status as today_status,
            
            -- Calculate Attendance Rate (Total Present / Total Days Recorded) * 100
            (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = 'present') * 100 / 
            (NULLIF((SELECT COUNT(*) FROM attendance WHERE student_id = s.id), 0)) as attendance_rate,
            
            -- Count Total Absences
            (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = 'absent') as absence_count

        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
        WHERE s.enrolled_class = ?
    `;

    db.query(sql, [date, classId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }
        res.json(results);
    });
});

// 2. POST: Mark Single Student Attendance (Upsert)
app.post('/attendance', (req, res) => {
    const { studentId, date, status } = req.body;

    // "INSERT ... ON DUPLICATE KEY UPDATE" handles both creating new and updating existing
    const sql = `
        INSERT INTO attendance (student_id, date, status) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE status = VALUES(status)
    `;

    db.query(sql, [studentId, date, status], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Attendance updated" });
    });
});

// 3. POST: Mark All Present
app.post('/attendance/mark-all', (req, res) => {
    const { studentIds, date } = req.body; // Expects an array of IDs

    if (!studentIds || studentIds.length === 0) return res.json("No students");

    // Build bulk insert query
    const values = studentIds.map(id => [id, date, 'present']);
    
    const sql = `
        INSERT INTO attendance (student_id, date, status) 
        VALUES ? 
        ON DUPLICATE KEY UPDATE status = 'present'
    `;

    db.query(sql, [values], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "All marked present" });
    });
});

// 4. GET: Frequent Absentees (Top 3)
app.get('/homeroom/:classId/absentees', (req, res) => {
    const classId = req.params.classId;
    
    const sql = `
        SELECT s.name, s.id, COUNT(a.id) as absences, MAX(a.date) as lastAbsent
        FROM students s
        JOIN attendance a ON s.id = a.student_id
        WHERE s.enrolled_class = ? AND a.status = 'absent'
        GROUP BY s.id
        ORDER BY absences DESC
        LIMIT 3
    `;

    db.query(sql, [classId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// --- STUDENT PLACEMENT ENDPOINTS ---

// 1. GET: Fetch Unassigned Students (For the Sidebar)
// GET: Fetch Unassigned Students (NULL class OR Generic Grade like 'Grade 10')
app.get('/students/unassigned', (req, res) => {
    // Logic: Unassigned if enrolled_class is NULL, Empty, or doesn't contain a hyphen '-'
    // This assumes specific classes are named "Grade 10-A", "Grade 11-B", etc.
    const sql = `
        SELECT * FROM students 
        WHERE enrolled_class IS NULL 
           OR enrolled_class = '' 
           OR enrolled_class NOT LIKE '%-%'
    `;
    
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
    });
});

// 2. GET: Fetch Classes WITH current students (For the Buckets)
// GET: Fetch Classes with their Students (Strictly from 'classes' table)
// GET: Fetch Classes with Students (Robust Version)
app.get('/classes/with-students', (req, res) => {
    const sql = `
        SELECT 
            c.id AS class_id, 
            c.class_name, 
            c.room_number, 
            t.name AS teacher_name,
            s.id AS student_id, 
            s.name AS student_name, 
            m.score AS student_grade, 
            g.gpa AS student_gpa
        FROM classes c 
        LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
        LEFT JOIN students s ON c.class_name = s.enrolled_class
        LEFT JOIN student_gpa_history g ON s.id = g.student_id
        LEFT JOIN student_subjects m ON s.id = m.student_id
        ORDER BY c.class_name
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("SQL Error in /classes/with-students:", err); // <--- LOGS ERROR TO TERMINAL
            return res.status(500).json({ error: "Database query failed" });
        }

        // Transform Flat SQL rows into Nested Buckets
        const bucketsMap = new Map();

        results.forEach(row => {
            if (!bucketsMap.has(row.class_id)) {
                bucketsMap.set(row.class_id, {
                    id: row.class_id,
                    class_name: row.class_name,
                    room_number: row.room_number,
                    teacher_name: row.teacher_name || "Unassigned",
                    students: []
                });
            }

            if (row.student_id) {
                bucketsMap.get(row.class_id).students.push({
                    id: row.student_id,
                    name: row.student_name,
                    grade: row.student_grade,
                    gpa: row.student_gpa
                });
            }
        });

        res.json(Array.from(bucketsMap.values()));
    });
});
// GET: Principal Dashboard Data (Aggregated)
// --- PRINCIPAL DASHBOARD ENDPOINTS ---

// 1. GET: Principal Dashboard Aggregated Data
app.get('/principal/dashboard', async (req, res) => {
    try {
        const settingsQuery = new Promise((resolve) => {
            db.query("SELECT * FROM school_settings WHERE id = 1", (err, data) => {
                resolve(data[0] || { currentSession: '2025-2026', startDate: 'Aug 2025' });
            });
        });

        const facultyQuery = new Promise((resolve) => {
            const sql = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN employment_type = 'Full-Time' THEN 1 ELSE 0 END) as fullTime,
                    SUM(CASE WHEN employment_type = 'Part-Time' THEN 1 ELSE 0 END) as partTime,
                    SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as onLeave
                FROM teachers
            `;
            db.query(sql, (err, data) => resolve(data[0]));
        });

        const studentQuery = new Promise((resolve) => {
            db.query("SELECT COUNT(*) as total FROM students", (err, data) => resolve(data[0].total));
        });

        const activityQuery = new Promise((resolve) => {
            db.query("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 3", (err, data) => resolve(data));
        });

        const [academicYearSettings, facultyStats, enrolledStudents, recentActivities] = await Promise.all([
            settingsQuery, facultyQuery, studentQuery, activityQuery
        ]);

        res.json({
            academicYearSettings: {
                currentSession: academicYearSettings.academic_year,
                startDate: academicYearSettings.start_date,
                endDate: academicYearSettings.end_date,
                workingDays: academicYearSettings.total_working_days,
                holidays: academicYearSettings.holidays
            },
            facultyStats,
            quickStats: {
                enrolledStudents,
                activeClasses: 12, // Dynamic query can go here
                avgAttendance: 94.5
            },
            recentActivities
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

// 2. POST: Update Academic Settings
app.post('/settings/academic', (req, res) => {
    const { academicYear, startDate, endDate, workingDays, holidays } = req.body;
    const sql = `
        UPDATE school_settings 
        SET academic_year=?, start_date=?, end_date=?, total_working_days=?, holidays=? 
        WHERE id=1
    `;
    db.query(sql, [academicYear, startDate, endDate, workingDays, holidays], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Settings updated successfully" });
    });
});

// 3. GET: Full Faculty List
app.get('/faculty', (req, res) => {
    db.query("SELECT * FROM teachers ORDER BY name", (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
    });
});

// 4. GET: All Activities
app.get('/activities/recent', (req, res) => {
    const limit = req.query.limit || 20;
    db.query(`SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ${limit}`, (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
    });
});

// 5. GET: Faculty Attendance (Mocked Data for Demo)
app.get('/faculty/attendance', (req, res) => {
    // In a real app, this would query a 'teacher_attendance' table
    // For now, we return mock data linked to actual teachers
    db.query("SELECT id, name FROM teachers", (err, teachers) => {
        if (err) return res.status(500).json(err);
        
        const attendanceData = teachers.map(t => ({
            id: t.id,
            name: t.name,
            present: Math.floor(Math.random() * 20) + 180, // Random days present
            absent: Math.floor(Math.random() * 5),
            late: Math.floor(Math.random() * 3),
            rate: 95 + Math.floor(Math.random() * 5) // 95-100%
        }));
        res.json(attendanceData);
    });
});

// 6. GET: Faculty Performance (Mocked Data for Demo)
app.get('/faculty/performance', (req, res) => {
    db.query("SELECT id, name, subject_specialty FROM teachers", (err, teachers) => {
        if (err) return res.status(500).json(err);
        
        const performanceData = teachers.map(t => ({
            id: t.id,
            name: t.name,
            subject: t.subject_specialty,
            rating: (Math.random() * (5.0 - 3.8) + 3.8).toFixed(1), // Random rating 3.8 - 5.0
            reviews: Math.floor(Math.random() * 50) + 10,
            lastReview: "Excellent classroom management."
        }));
        res.json(performanceData);
    });
});

// GET: Single Student Performance Data
app.get('/students/:id/performance', (req, res) => {
    const studentId = req.params.id;

    // 1. Fetch Basic Info
    const sqlInfo = "SELECT * FROM students WHERE id = ?";
    
    // 2. Fetch Attendance (Mock calculation for now)
    // You would normally do a JOIN or separate query on attendance table
    
    db.query(sqlInfo, [studentId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ error: "Student not found" });

        const student = results[0];

        // Mocking extra data for the dashboard visuals since we might not have full grades table yet
        const responseData = {
            id: student.id,
            name: student.name,
            email: student.email,
            grade: student.enrolled_class || "Grade 11-A",
            attendance: 92, // You can make this dynamic later
            gpa: (Math.random() * (4.0 - 2.5) + 2.5).toFixed(2), // Mock GPA
            missingAssignments: Math.floor(Math.random() * 3),
            status: Math.random() > 0.8 ? "At Risk" : "Good Standing"
        };

        res.json(responseData);
    });
});


// --- STUDENT PLACEMENT ENDPOINT ---
app.post('/students/placement/finalize', (req, res) => {
    const { placements } = req.body; // Expects array: [{ studentId, className }, ...]

    if (!placements || placements.length === 0) {
        return res.json({ message: "No placements to save." });
    }

    // SQL to update a single student's class
    const sql = "UPDATE students SET enrolled_class = ? WHERE id = ?";

    // Create a list of promises to update every student in the list
    const updatePromises = placements.map(p => {
        return new Promise((resolve, reject) => {
            // Remove 'temp-' prefix if your frontend added it for drag-and-drop uniqueness
            // (Only if your real IDs are integers)
            let cleanId = p.studentId;
            if (String(cleanId).startsWith('temp-')) {
                 // If it's a temp ID (newly added in frontend), you might skip it 
                 // or handle it differently. For now, we assume valid DB IDs.
                 return resolve(); 
            }

            db.query(sql, [p.className, cleanId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    });

    // Wait for ALL updates to finish
    Promise.all(updatePromises)
        .then(() => {
            console.log(`Updated ${placements.length} student placements.`);
            res.json({ message: "Placements updated successfully" });
        })
        .catch(err => {
            console.error("Error updating placements:", err);
            res.status(500).json(err);
        });
});

// DELETE: Remove a Class and Unassign its Students
app.delete('/classes/:id', (req, res) => {
    const classId = req.params.id;

    // 1. Find the class name first (e.g., "Grade 10-A")
    db.query("SELECT class_name FROM classes WHERE id = ?", [classId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Class not found" });

        const className = results[0].class_name; // "Grade 10-A"
        
        // Extract generic grade (e.g., "Grade 10") to reset students
        // If name is "Grade 10-A", split by '-' gets "Grade 10"
        const genericGrade = className.split('-')[0].trim(); 

        // 2. Update students: Change "Grade 10-A" -> "Grade 10" (Unassigned)
        db.query("UPDATE students SET enrolled_class = ? WHERE enrolled_class = ?", [genericGrade, className], (err) => {
            if (err) return res.status(500).json(err);

            // 3. Now it's safe to delete the class
            db.query("DELETE FROM classes WHERE id = ?", [classId], (err) => {
                if (err) return res.status(500).json(err);
                res.json({ message: "Class deleted and students unassigned." });
            });
        });
    });
});
// POST: Create a New Class
// POST: Create a New Class (Fixed for 500 Errors)
app.post('/classes', (req, res) => {
    const { className, roomNumber, teacherId } = req.body;

    // 1. Log the incoming data (Check your terminal to see what is arriving)
    console.log("Creating Class:", { className, roomNumber, teacherId });

    // 2. Validation
    if (!className || !roomNumber) {
        return res.status(400).json({ message: "Class Name and Room Number are required." });
    }

    // 3. Handle Teacher ID: Convert "none", empty string, or undefined to NULL
    let teacherValue = null;
    if (teacherId && teacherId !== 'none' && teacherId !== '') {
        teacherValue = teacherId;
    }

    const sql = "INSERT INTO classes (class_name, room_number, id) VALUES (?, ?, ?)";
    
    db.query(sql, [className, roomNumber, teacherValue], (err, result) => {
        if (err) {
            console.error("SQL Error:", err); // <--- THIS WILL SHOW IN YOUR TERMINAL
            
            // Handle Duplicate Class Name
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: "Class name already exists!" });
            }
            
            // Handle Invalid Teacher ID (Foreign Key fail)
            if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
                 return res.status(400).json({ message: "Selected teacher does not exist." });
            }

            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Class created successfully", id: result.insertId });
    });
});
// POST: Add a New Teacher
app.post('/teachers', (req, res) => {
    const { name, email, subject } = req.body;
    
    // Validate input
    if (!name || !email) {
        return res.status(400).json({ message: "Name and Email are required" });
    }

    const sql = "INSERT INTO teachers (name, email, subject_specialty, status) VALUES (?, ?, ?, 'Active')";
    
    db.query(sql, [name, email, subject], (err, result) => {
        if (err) {
            console.error("Error adding teacher:", err);
            return res.status(500).json(err);
        }
        res.json({ message: "Teacher added successfully", id: result.insertId });
    });
});
// DELETE: Remove a Teacher
app.delete('/teachers/:id', (req, res) => {
    const teacherId = req.params.id;
    
    const sql = "DELETE FROM teachers WHERE id = ?";
    
    db.query(sql, [teacherId], (err, result) => {
        if (err) {
            console.error("Error deleting teacher:", err);
            return res.status(500).json(err);
        }
        res.json({ message: "Teacher deleted successfully" });
    });
});
app.get('/teachers/available-for-homeroom', (req, res) => {
    // Logic: Select teachers whose ID is NOT found in the 'classes' table
    const sql = `
        SELECT * FROM teachers 
        WHERE status = 'Active' 
        AND id NOT IN (
            SELECT id FROM classes WHERE id IS NOT NULL
        )
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching available teachers:", err);
            return res.status(500).json(err);
        }
        res.json(results);
    });
});
// POST: Login Handler
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    
    db.query(sql, [email, password], (err, data) => {
        if (err) {
            console.error("Login Error:", err);
            return res.status(500).json({ message: "Server Error" });
        }

        if (data.length > 0) {
            const user = data[0];
            // Return success and the user's role so frontend knows where to redirect
            return res.json({ 
                status: "Success", 
                role: user.role, 
                name: user.name 
            });
        
        } else {
            return res.status(401).json({ message: "Invalid email or password" });
        }
    });
});

// --- USER ACCOUNT MANAGEMENT ---

// GET: Fetch all users (for the Accounts Page)
app.get('/users', (req, res) => {
    const sql = "SELECT * FROM users ORDER BY role, name";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
    });
});

// POST: Add a new user account
app.post('/users', (req, res) => {
    const { name, email, password, role } = req.body;
    
    // Simple Validation
    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, Password, and Role are required." });
    }

    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [name, email, password, role], (err, result) => {
        if (err) {
            console.error(err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: "Email already exists." });
            }
            return res.status(500).json(err);
        }
        res.json({ message: "User added successfully", id: result.insertId });
    });
});

// DELETE: Remove a user account
app.delete('/users/:id', (req, res) => {
    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "User deleted successfully" });
    });
});

const cors = require('cors');

app.use(cors({
    origin: [
        "https://step-lms.netlify.app/" // Replace with your actual Netlify URL
        // "http://localhost:3000",              // Keep this for local testing
        // "http://localhost:5173"               // For Vite testing
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));