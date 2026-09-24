const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt"); // <-- MAKE SURE THIS LINE IS AT THE VERY TOP
const nodemailer = require("nodemailer");

const app = express();
app.use(
  cors({
    origin: [
      "https://step-lms.netlify.app", // Remove the trailing slash here just to be safe
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
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
  keepAliveInitialDelay: 10000,
});

// 2. Test the connection
// 2. Test the connection and Initialize Database Schema
db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    return;
  }
  
  console.log("Connected to Online MySQL Database Pool!");

  // Array of all table schemas needed for the application
  const tableSchemas = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS teachers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      subject_specialty VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Active',
      assigned_class VARCHAR(50),
      employment_type VARCHAR(50) DEFAULT 'Full-Time',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE,
      enrolled_class VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS classes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      class_name VARCHAR(50) UNIQUE NOT NULL,
      room_number VARCHAR(50) NOT NULL,
      homeroom_teacher_id INT NULL,
      FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      date DATE NOT NULL,
      status ENUM('present', 'absent', 'late') NOT NULL,
      UNIQUE KEY unique_attendance (student_id, date),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS curriculum_subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_name VARCHAR(100) NOT NULL,
      grade_category VARCHAR(20) NOT NULL,
      periods_per_week INT NOT NULL,
      teacher_name VARCHAR(100) DEFAULT 'Unassigned',
      room_number VARCHAR(50) DEFAULT 'TBA',
      color VARCHAR(20) DEFAULT '#3b82f6'
    )`,

    `CREATE TABLE IF NOT EXISTS school_settings (
      id INT PRIMARY KEY,
      academic_year VARCHAR(20),
      start_date VARCHAR(50),
      end_date VARCHAR(50),
      total_working_days INT,
      holidays INT
    )`,

    `CREATE TABLE IF NOT EXISTS leave_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id INT NOT NULL,
      leave_type ENUM('sick', 'casual', 'working'),
      leave_date DATE NOT NULL,
      reason TEXT,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_by INT NULL,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES teachers(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS timetables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      section_name VARCHAR(50) NOT NULL,
      day_of_week VARCHAR(20) NOT NULL,
      start_time VARCHAR(20) NOT NULL,
      class_id VARCHAR(100),
      subject VARCHAR(100),
      teacher_name VARCHAR(100),
      room_number VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Optional tables based on your dashboard queries
    `CREATE TABLE IF NOT EXISTS student_gpa_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      semester VARCHAR(50),
      gpa DECIMAL(3,2),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];
  // Create default admin account if it doesn't exist or fix its password
    const adminEmail = "admin@school.edu";
    db.query("SELECT * FROM users WHERE email = ?", [adminEmail], async (err, results) => {
      if (!err && results.length === 0) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        db.query(
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
          ["Principal Skinner", adminEmail, hashedPassword, "principal"]
        );
      }
    });

  // Execute all table creations sequentially
  const initializeDatabase = async () => {
    for (const schema of tableSchemas) {
      await new Promise((resolve, reject) => {
        connection.query(schema, (err) => {
          if (err) {
            console.error(`Error creating table: ${err.message}`);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    // Insert default school settings if they don't exist
    connection.query(
      `INSERT IGNORE INTO school_settings (id, academic_year, start_date, end_date, total_working_days, holidays) 
       VALUES (1, '2025-2026', 'Aug 2025', 'May 2026', 180, 20)`
    );

    console.log("All database tables checked/created successfully.");
    connection.release();
  };

  initializeDatabase().catch(() => connection.release());
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
app.get("/students", (req, res) => {
  const sql = "SELECT * FROM students";
  db.query(sql, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

// POST: Add a new student
app.post("/students", (req, res) => {
  const sql =
    "INSERT INTO students (`name`, `email`, `enrolled_class`, `status`) VALUES (?)";
  const values = [
    req.body.name,
    req.body.email,
    req.body.enrolledClass, // Note: Matches React state name
    req.body.status,
  ];
  db.query(sql, [values], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json("Student has been created successfully.");
  });
});

// PUT: Update a student
app.put("/students/:id", (req, res) => {
  const id = req.params.id;
  const sql =
    "UPDATE students SET `name`= ?, `email`= ?, `enrolled_class`= ?, `status`= ? WHERE id = ?";
  const values = [
    req.body.name,
    req.body.email,
    req.body.enrolledClass,
    req.body.status,
  ];
  db.query(sql, [...values, id], (err, data) => {
    if (err) return resres.status(500).json(err);
    return res.json("Student updated successfully.");
  });
});
// DELETE: Remove a student
app.delete("/students/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM students WHERE id = ?";
  db.query(sql, [id], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json("Student deleted successfully.");
  });
});

// --- ANNOUNCEMENT ENDPOINTS ---

// GET: Fetch all announcements (newest first)
app.get("/api/announcements", (req, res) => {
  const sql = "SELECT * FROM announcements ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch announcements" });
    res.json(results);
  });
});

// POST: Create a new announcement
app.post("/api/announcements", (req, res) => {
  const { title, message, priority } = req.body;
  
  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required" });
  }

  const sql = "INSERT INTO announcements (title, message, priority) VALUES (?, ?, ?)";
  db.query(sql, [title, message, priority || 'medium'], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to create announcement" });
    res.json({ message: "Announcement created successfully", id: result.insertId });
  });
});

// GET: Fetch Dashboard Data (Crash-Proof Version)
app.get("/student-dashboard/:id", (req, res) => {
  const studentId = req.params.id;
  const responseData = {};

  // 1. Get Basic Profile
  db.query(
    "SELECT * FROM students WHERE id = ?",
    [studentId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) return res.status(404).json("Student not found");

      responseData.profile = result[0];
      const studentClass = result[0].enrolled_class || ""; 

      // 2. Get Class Teacher
      db.query(
        "SELECT * FROM teachers WHERE assigned_class = ?",
        [studentClass],
        (err, teacherResult) => {
          if (err) {
            console.log("Teacher table error:", err.message);
            responseData.teacher = null; 
          } else {
            responseData.teacher = teacherResult.length > 0 ? teacherResult[0] : null;
          }

          // 3. Get GPA History
          db.query(
            "SELECT semester, gpa FROM student_gpa_history WHERE student_id = ?",
            [studentId],
            (err, gpaResult) => {
              if (err) {
                console.log("GPA table error:", err.message);
                responseData.gpaHistory = [];
              } else {
                responseData.gpaHistory = gpaResult;
              }

              // 4. Get Subject Strengths (Updated with JOIN)
              db.query(
                `SELECT c.subject_name AS subject, ss.score 
                 FROM student_subjects ss
                 JOIN curriculum_subjects c ON ss.subject_id = c.id
                 WHERE ss.student_id = ?`,
                [studentId],
                (err, subResult) => {
                  if (err) {
                    console.log("Subjects table error:", err.message);
                    responseData.subjects = [];
                  } else {
                    responseData.subjects = subResult;
                  }

                  // 5. Get Focus Areas
                  db.query(
                    "SELECT topic, confidence, priority FROM student_focus_areas WHERE student_id = ?",
                    [studentId],
                    (err, focusResult) => {
                      if (err) {
                        console.log("Focus Areas table error:", err.message);
                        responseData.focusAreas = [];
                      } else {
                        responseData.focusAreas = focusResult;
                      }

                      // Send whatever data we managed to collect
                      res.json(responseData);
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// ... existing imports ...

// 1. GET: Fetch Homeroom Data (Students + Today's Attendance + Stats)
app.get("/homeroom/:classId", (req, res) => {
  const classId = req.params.classId; // e.g., "Grade 11-A"
  const date = req.query.date || new Date().toISOString().split("T")[0]; // Default to today

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
app.post("/attendance", (req, res) => {
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
app.post("/attendance/mark-all", (req, res) => {
  const { studentIds, date } = req.body; // Expects an array of IDs

  if (!studentIds || studentIds.length === 0) return res.json("No students");

  // Build bulk insert query
  const values = studentIds.map((id) => [id, date, "present"]);

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
app.get("/homeroom/:classId/absentees", (req, res) => {
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
app.get("/students/unassigned", (req, res) => {
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
app.get("/classes/with-students", (req, res) => {
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

    results.forEach((row) => {
      if (!bucketsMap.has(row.class_id)) {
        bucketsMap.set(row.class_id, {
          id: row.class_id,
          class_name: row.class_name,
          room_number: row.room_number,
          teacher_name: row.teacher_name || "Unassigned",
          students: [],
        });
      }

      if (row.student_id) {
        bucketsMap.get(row.class_id).students.push({
          id: row.student_id,
          name: row.student_name,
          grade: row.student_grade,
          gpa: row.student_gpa,
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
        // Query 1: Get Total Teachers and Full-Time Teachers from the teachers table
        const teacherQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN employment_type = 'Full-Time' THEN 1 ELSE 0 END) as fullTime
            FROM teachers
        `;
        
        // Query 2: Get Teachers currently on leave (approved status for today's date)
        const leaveQuery = `
            SELECT COUNT(DISTINCT teacher_id) as onLeave
            FROM leave_requests
            WHERE leave_date = CURDATE() AND status = 'approved'
        `;

        // Execute queries concurrently
        const [
            [[teacherStats]], 
            [[leaveStats]]
        ] = await Promise.all([
            db.promise().query(teacherQuery),
            db.promise().query(leaveQuery)
        ]);

        // Note: Make sure to keep your existing queries for 'quickStats' and 'settings' if you have them!

        res.json({
            // Mocking settings/quickStats if you don't already have them querying the DB
            settings: { currentSession: '2025/2026', startDate: '2026-01-05' },
            quickStats: { enrolledStudents: 450, activeClasses: 12, avgAttendance: 87.3 },
            
            // Injecting the live database counts here:
            faculty: {
                total: teacherStats.total || 0,
                fullTime: teacherStats.fullTime || 0,
                onLeave: leaveStats.onLeave || 0
            }
        });

    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});

// 2. POST: Update Academic Settings
app.post("/settings/academic", (req, res) => {
  const { academicYear, startDate, endDate, workingDays, holidays } = req.body;
  const sql = `
        UPDATE school_settings 
        SET academic_year=?, start_date=?, end_date=?, total_working_days=?, holidays=? 
        WHERE id=1
    `;
  db.query(
    sql,
    [academicYear, startDate, endDate, workingDays, holidays],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Settings updated successfully" });
    },
  );
});

// 3. GET: Full Faculty List
app.get("/faculty", (req, res) => {
  db.query("SELECT * FROM teachers ORDER BY name", (err, data) => {
    if (err) return res.status(500).json(err);
    res.json(data);
  });
});

// 4. GET: All Activities
app.get("/activities/recent", (req, res) => {
  const limit = req.query.limit || 20;
  db.query(
    `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ${limit}`,
    (err, data) => {
      if (err) return res.status(500).json(err);
      res.json(data);
    },
  );
});

// 5. GET: Faculty Attendance (Mocked Data for Demo)
app.get("/faculty/attendance", (req, res) => {
  // In a real app, this would query a 'teacher_attendance' table
  // For now, we return mock data linked to actual teachers
  db.query("SELECT id, name FROM teachers", (err, teachers) => {
    if (err) return res.status(500).json(err);

    const attendanceData = teachers.map((t) => ({
      id: t.id,
      name: t.name,
      present: Math.floor(Math.random() * 20) + 180, // Random days present
      absent: Math.floor(Math.random() * 5),
      late: Math.floor(Math.random() * 3),
      rate: 95 + Math.floor(Math.random() * 5), // 95-100%
    }));
    res.json(attendanceData);
  });
});

// 6. GET: Faculty Performance (Mocked Data for Demo)
app.get("/faculty/performance", (req, res) => {
  db.query(
    "SELECT id, name, subject_specialty FROM teachers",
    (err, teachers) => {
      if (err) return res.status(500).json(err);

      const performanceData = teachers.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject_specialty,
        rating: (Math.random() * (5.0 - 3.8) + 3.8).toFixed(1), // Random rating 3.8 - 5.0
        reviews: Math.floor(Math.random() * 50) + 10,
        lastReview: "Excellent classroom management.",
      }));
      res.json(performanceData);
    },
  );
});

// GET: Single Student Performance Data
app.get("/students/:id/performance", (req, res) => {
  const studentId = req.params.id;

  // 1. Fetch Basic Info
  const sqlInfo = "SELECT * FROM students WHERE id = ?";

  // 2. Fetch Attendance (Mock calculation for now)
  // You would normally do a JOIN or separate query on attendance table

  db.query(sqlInfo, [studentId], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0)
      return res.status(404).json({ error: "Student not found" });

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
      status: Math.random() > 0.8 ? "At Risk" : "Good Standing",
    };

    res.json(responseData);
  });
});









// POST: Save or update student marks (Homeroom Teachers Only)
app.post("/api/student-marks", async (req, res) => {
  const { teacher_id, student_id, marks } = req.body; 

  if (!teacher_id || !student_id || !marks) {
    return res.status(400).json({ message: "Missing required data." });
  }

  try {
    const verifyQuery = `
      SELECT c.homeroom_teacher_id 
      FROM students s
      JOIN classes c ON s.enrolled_class = c.class_name
      WHERE s.id = ?
    `;

    db.query(verifyQuery, [student_id], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error during verification." });
      
      if (results.length === 0) {
        return res.status(404).json({ error: "Student or class not found." });
      }

      if (parseInt(teacher_id) !== results[0].homeroom_teacher_id) {
        return res.status(403).json({ 
          error: "Unauthorized: Only the homeroom teacher can update marks." 
        });
      }

      // Updated standard MySQL syntax for bulk insert/update
      const insertQuery = `
        INSERT INTO student_subjects (student_id, subject_id, score) 
        VALUES ?
        ON DUPLICATE KEY UPDATE score = VALUES(score)
      `;

      const values = marks.map(mark => [student_id, mark.subject_id, mark.score]);

      db.query(insertQuery, [values], (insertErr) => {
        if (insertErr) {
          console.error("MySQL Insert Error:", insertErr); // Will print exact issue to your backend terminal
          return res.status(500).json({ error: "Failed to save marks." });
        }
        
        res.status(200).json({ message: "Marks successfully updated." });
      });
    });

  } catch (error) {
    console.error("Save Marks Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// GET: Fetch students and their marks for a specific homeroom teacher
app.get("/api/homeroom/:teacher_id/students", (req, res) => {
  const teacherId = req.params.teacher_id;

  const sql = `
    SELECT 
      s.id, s.name, s.enrolled_class as class_name,
      sm.score, sub.subject_name
    FROM students s
    JOIN classes c ON s.enrolled_class = c.class_name
    LEFT JOIN student_subjects sm ON s.id = sm.student_id
    LEFT JOIN curriculum_subjects sub ON sm.subject_id = sub.id  -- Fixed table name here
    WHERE c.homeroom_teacher_id = ? AND s.status = 'active'
  `;

  db.query(sql, [teacherId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.status(200).json(results);
  });
});

app.get("/api/subjects", (req, res) => {
  const sql = "SELECT id, subject_name FROM curriculum_subjects";
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error fetching subjects" });
    res.status(200).json(results);
  });
});









// --- STUDENT PLACEMENT ENDPOINT ---
app.post("/students/placement/finalize", (req, res) => {
  const { placements } = req.body; // Expects array: [{ studentId, className }, ...]

  if (!placements || placements.length === 0) {
    return res.json({ message: "No placements to save." });
  }

  // SQL to update a single student's class
  const sql = "UPDATE students SET enrolled_class = ? WHERE id = ?";

  // Create a list of promises to update every student in the list
  const updatePromises = placements.map((p) => {
    return new Promise((resolve, reject) => {
      // Remove 'temp-' prefix if your frontend added it for drag-and-drop uniqueness
      // (Only if your real IDs are integers)
      let cleanId = p.studentId;
      if (String(cleanId).startsWith("temp-")) {
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
    .catch((err) => {
      console.error("Error updating placements:", err);
      res.status(500).json(err);
    });
});

// DELETE: Remove a Class and Unassign its Students
app.delete("/classes/:id", (req, res) => {
  const classId = req.params.id;

  // 1. Find the class name first (e.g., "Grade 10-A")
  db.query(
    "SELECT class_name FROM classes WHERE id = ?",
    [classId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(404).json({ message: "Class not found" });

      const className = results[0].class_name; // "Grade 10-A"

      // Extract generic grade (e.g., "Grade 10") to reset students
      // If name is "Grade 10-A", split by '-' gets "Grade 10"
      const genericGrade = className.split("-")[0].trim();

      // 2. Update students: Change "Grade 10-A" -> "Grade 10" (Unassigned)
      db.query(
        "UPDATE students SET enrolled_class = ? WHERE enrolled_class = ?",
        [genericGrade, className],
        (err) => {
          if (err) return res.status(500).json(err);

          // 3. Now it's safe to delete the class
          db.query("DELETE FROM classes WHERE id = ?", [classId], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Class deleted and students unassigned." });
          });
        },
      );
    },
  );
});
// POST: Create a New Class
// POST: Create a New Class (Fixed for 500 Errors)
app.post("/classes", (req, res) => {
  const { className, roomNumber, teacherId } = req.body;

  // 1. Log the incoming data (Check your terminal to see what is arriving)
  console.log("Creating Class:", { className, roomNumber, teacherId });

  // 2. Validation
  if (!className || !roomNumber) {
    return res
      .status(400)
      .json({ message: "Class Name and Room Number are required." });
  }

  // 3. Handle Teacher ID: Convert "none", empty string, or undefined to NULL
  let teacherValue = null;
  if (teacherId && teacherId !== "none" && teacherId !== "") {
    teacherValue = teacherId;
  }

  const sql =
    "INSERT INTO classes (class_name, room_number, homeroom_teacher_id) VALUES (?, ?, ?)";

  db.query(sql, [className, roomNumber, teacherValue], (err, result) => {
    if (err) {
      console.error("SQL Error:", err); // <--- THIS WILL SHOW IN YOUR TERMINAL

      // Handle Duplicate Class Name
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Class name already exists!" });
      }

      // Handle Invalid Teacher ID (Foreign Key fail)
      if (
        err.code === "ER_NO_REFERENCED_ROW_2" ||
        err.code === "ER_NO_REFERENCED_ROW"
      ) {
        return res
          .status(400)
          .json({ message: "Selected teacher does not exist." });
      }

      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Class created successfully", id: result.insertId });
  });
});
// POST: Add a New Teacher
app.post("/teachers", (req, res) => {
  const { name, email, subject } = req.body;

  // Validate input
  if (!name || !email) {
    return res.status(400).json({ message: "Name and Email are required" });
  }

  const sql =
    "INSERT INTO teachers (name, email, subject_specialty, status) VALUES (?, ?, ?, 'Active')";

  db.query(sql, [name, email, subject], (err, result) => {
    if (err) {
      console.error("Error adding teacher:", err);
      return res.status(500).json(err);
    }
    res.json({ message: "Teacher added successfully", id: result.insertId });
  });
});
// DELETE: Remove a Teacher
app.delete("/teachers/:id", (req, res) => {
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
app.get("/teachers/available-for-homeroom", (req, res) => {
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
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  // Notice the LEFT JOIN! We connect the tables using their shared email address.
  const sql = `
    SELECT u.role, u.name, u.id as user_id, t.id as teacher_id 
    FROM users u 
    LEFT JOIN teachers t ON u.email = t.email 
    WHERE u.email = ? AND u.password = ?
  `;

  db.query(sql, [email, password], (err, data) => {
    if (err) {
      console.error("Login Error:", err);
      return res.status(500).json({ message: "Server Error" });
    }

    if (data.length > 0) {
      const user = data[0];

      // The magic: If the logged-in user is a teacher, send back their 'teacher_id' (1).
      // If they are an admin or principal, send back their normal 'user_id' (1 or 5).
      const correctId =
        user.role === "teacher" ? user.teacher_id : user.user_id;

      // Return success and the user's role so frontend knows where to redirect
      return res.json({
        status: "Success",
        role: user.role,
        id: correctId,
        name: user.name,
      });
    } else {
      return res.status(401).json({ message: "Invalid email or password" });
    }
  });
});

// --- USER ACCOUNT MANAGEMENT ---

// GET: Fetch all users (for the Accounts Page)
app.get("/users", (req, res) => {
  const sql = "SELECT * FROM users ORDER BY role, name";
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json(err);
    res.json(data);
  });
});

// POST: Add a new user account (with auto-profile creation)
app.post("/users", (req, res) => {
  const { name, email, password, role, enrolledClass } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: "Email, Password, and Role are required." });
  }

  // Get a connection for the transaction
  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: "Database connection failed" });

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ error: "Transaction start failed" });
      }

      // 1. Insert into the main `users` table
      connection.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, password, role], (err, userResult) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email already exists." });
            res.status(500).json(err);
          });
        }

        // 2. Check role and insert into specific profile table
        if (role === 'teacher') {
          connection.query("INSERT INTO teachers (name, email) VALUES (?, ?)", [name, email], (err) => {
            if (err) return connection.rollback(() => { connection.release(); res.status(500).json(err); });
            commitTransaction();
          });
        } else if (role === 'student') {
          connection.query("INSERT INTO students (name, email, enrolled_class) VALUES (?, ?, ?)", [name, email, enrolledClass || 'Unassigned'], (err) => {
            if (err) return connection.rollback(() => { connection.release(); res.status(500).json(err); });
            commitTransaction();
          });
        } else {
           // Admin or Principal
           commitTransaction();
        }

        // 3. Finalize the transaction
        function commitTransaction() {
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => { connection.release(); res.status(500).json({ error: "Commit failed" }); });
            }
            connection.release();
            res.json({ message: "User account and profile created successfully", id: userResult.insertId });
          });
        }
      });
    });
  });
});

// DELETE: Remove a user account
app.delete("/users/:id", (req, res) => {
  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "User deleted successfully" });
  });
});

// --- TIMETABLE ENDPOINTS ---
// Notice we added /:teacherId to the URL
app.get("/api/timetable/:teacherId", (req, res) => {
  const teacherId = req.params.teacherId;

  // Now we filter by the teacher_id!
  const sql = "SELECT * FROM teacher_timetable WHERE teacher_id = ?";

  db.query(sql, [teacherId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to fetch timetable" });
    }
    return res.json(results);
  });
});
// --- CURRICULUM SUBJECT ENDPOINTS ---

// GET: Fetch subjects based on grade category
app.get('/curriculum-subjects', (req, res) => {
    const { category } = req.query; 
    let sql = "SELECT * FROM curriculum_subjects";
    let params = [];
    
    // If a category is requested, filter the table
    if (category) {
        sql += " WHERE grade_category = ?";
        params.push(category);
    }
    
    db.query(sql, params, (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
    });
});

// POST: Add a new subject card
app.post('/curriculum-subjects', (req, res) => {
    const { subject_name, grade_category, periods_per_week, teacher_name, room_number, color } = req.body;
    const sql = "INSERT INTO curriculum_subjects (subject_name, grade_category, periods_per_week, color) VALUES (?, ?, ?, ?, ?, ?)";
    
    const values = [subject_name, grade_category, periods_per_week, teacher_name || 'Unassigned', room_number || 'TBA', color || '#3b82f6'];
    
    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Subject added successfully", id: result.insertId });
    });
});

// --- LEAVE REQUEST ENDPOINTS ---

// GET: Fetch available casual leaves for a teacher
app.get("/leave-availability", (req, res) => {
  const teacherId = req.query.teacherId;
  if (!teacherId)
    return res.status(400).json({ message: "Teacher ID required" });

  const sql =
    "SELECT COUNT(*) as used FROM leave_requests WHERE teacher_id = ? AND leave_type = 'casual' AND status = 'approved'";
  db.query(sql, [teacherId], (err, data) => {
    if (err) return res.status(500).json(err);
    const used = data[0].used;
    const available = 5 - used;
    return res.json({ availableCasual: Math.max(0, available) });
  });
});

// POST: Submit a leave request
app.post("/leave-request", (req, res) => {
  const { teacherId, leaveType, date, reason } = req.body;
  if (!teacherId || !leaveType || !date || !reason) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let status = "pending";
  if (leaveType === "sick") {
    status = "approved";
  }

  const sql =
    "INSERT INTO leave_requests (teacher_id, leave_type, leave_date, reason, status) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [teacherId, leaveType, date, reason, status], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json({
      message: "Leave request submitted successfully",
      id: data.insertId,
    });
  });
});

// GET: Fetch leave requests for a teacher
app.get("/leave-requests", (req, res) => {
  const teacherId = req.query.teacherId;
  if (!teacherId)
    return res.status(400).json({ message: "Teacher ID required" });

  const sql =
    "SELECT * FROM leave_requests WHERE teacher_id = ? ORDER BY submitted_at DESC";
  db.query(sql, [teacherId], (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data);
  });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});




// POST: Add a new subject card
app.post('/curriculum-subjects', (req, res) => {
    const { subject_name, grade_category, periods_per_week, teacher_id, room_number, color } = req.body;
    
    const sql = `
      INSERT INTO curriculum_subjects 
      (subject_name, grade_category, periods_per_week, teacher_id, room_number, color) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    // Pass null if teacher_id is empty/unassigned so the DB accepts it
    const validTeacherId = teacher_id && teacher_id !== 'unassigned' ? parseInt(teacher_id) : null;
    
    const values = [
        subject_name, 
        grade_category, 
        periods_per_week, 
        validTeacherId, 
        room_number || 'TBA', 
        color || '#3b82f6'
    ];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }
        res.json({ message: "Subject added successfully", id: result.insertId });
    });
});



// --- TIMETABLE SCHEDULE ENDPOINTS ---

// POST: Save the entire generated master schedule to the database
// POST: Save the entire generated master schedule to the database
app.post("/schedules", (req, res) => {
  const { schedules } = req.body;

  if (!schedules || schedules.length === 0) {
    return res.status(400).json({ message: "No schedule data provided" });
  }

  // Use a transaction so we don't wipe old schedules if the new one fails
  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: "Database connection error" });

    connection.beginTransaction(async (err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: "Transaction start failed" });
      }

      try {
        // 1. Clear old master schedule and old teacher timetables
        await new Promise((resolve, reject) => {
          connection.query("DELETE FROM timetables", (err) => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => {
          connection.query("DELETE FROM teacher_timetable", (err) => err ? reject(err) : resolve());
        });

        // 2. Insert into the main `timetables` table
        const masterValues = schedules.map(s => [
          s.section, s.day, s.time_slot, s.class_id, s.subject, s.teacher_id, s.room
        ]);

        const insertMasterQuery = `
          INSERT INTO timetables 
          (section_name, day_of_week, start_time, class_id, subject, teacher_id, room_number) 
          VALUES ?
        `;

        await new Promise((resolve, reject) => {
          connection.query(insertMasterQuery, [masterValues], (err) => err ? reject(err) : resolve());
        });

        // 3. Process data for `teacher_timetable` (Pivoted format)
        const teacherSchedules = {};
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        
        // Group the incoming slots by teacher and day
        schedules.forEach(s => {
          if (!s.teacher_id) return; // Skip unassigned classes

          const key = `${s.teacher_id}_${s.day}`;
          if (!teacherSchedules[key]) {
             teacherSchedules[key] = {
                teacher_id: s.teacher_id,
                day: s.day,
                "07:45": "Free",
                "08:25": "Free",
                "09:05": "Free",
                "09:45": "Free",
                "10:25": "Free",
                "11:05": "Interval", // Defaults to Interval for this specific block
                "11:30": "Free",
                "12:10": "Free",
                "12:50": "Free"
             };
          }
          // Insert the section (e.g., "11-A") into the correct time slot
          teacherSchedules[key][s.time_slot] = s.section;
        });

        // Ensure every active teacher gets a full 5-day row structure, even on days they have no classes
        const activeTeachers = [...new Set(schedules.map(s => s.teacher_id).filter(id => id))];
        activeTeachers.forEach(teacherId => {
            daysOfWeek.forEach(day => {
                const key = `${teacherId}_${day}`;
                if (!teacherSchedules[key]) {
                    teacherSchedules[key] = {
                        teacher_id: teacherId, day: day,
                        "07:45": "Free", "08:25": "Free", "09:05": "Free",
                        "09:45": "Free", "10:25": "Free", "11:05": "Interval",
                        "11:30": "Free", "12:10": "Free", "12:50": "Free"
                    };
                }
            });
        });

        // Convert the object mapping into a nested array for SQL bulk insert
        const teacherValues = Object.values(teacherSchedules).map(t => [
            t.teacher_id, t.day,
            t["07:45"], t["08:25"], t["09:05"], t["09:45"], t["10:25"], 
            t["11:05"], t["11:30"], t["12:10"], t["12:50"]
        ]);

        if (teacherValues.length > 0) {
            // Notice the backticks (`) used for column names with spaces and AM/PM symbols
            const insertTeacherQuery = `
              INSERT INTO teacher_timetable
              (teacher_id, day_of_week, \`7:45 - 8:25 AM\`, \`8:25 - 9:05 AM\`, \`9:05 - 9:45 AM\`, \`9:45 - 10:25 AM\`, \`10:25 - 11:05 AM\`, \`11:05 - 11:30 AM\`, \`11:30 - 12:10 PM\`, \`12:10 - 12:50 PM\`, \`12:50 - 1:30 PM\`)
              VALUES ?
            `;
            await new Promise((resolve, reject) => {
              connection.query(insertTeacherQuery, [teacherValues], (err) => err ? reject(err) : resolve());
            });
        }

        // Commit transaction
        connection.commit((err) => {
          if (err) throw err;
          connection.release();
          res.status(200).json({ message: "Master schedule and Teacher timetables saved successfully." });
        });

      } catch (error) {
        connection.rollback(() => {
          connection.release();
          console.error("Transaction Error:", error);
          res.status(500).json({ message: "Failed to insert schedules", error: error.message });
        });
      }
    });
  });
});
// GET: Load the master schedule back into the nested grid format
app.get("/schedules", (req, res) => {
  // Use a JOIN to grab the teacher's text name based on the teacher_id
  const sql = `
    SELECT 
      t.section_name, 
      t.day_of_week, 
      t.start_time, 
      t.class_id, 
      t.subject, 
      t.teacher_id, 
      t.room_number,
      teachers.name AS teacher_name 
    FROM timetables t
    LEFT JOIN teachers ON t.teacher_id = teachers.id
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Failed to load schedule:", err);
      return res.status(500).json({ error: "Failed to fetch schedules" });
    }

    // Reconstruct the nested grid object for React
    const timetable = {};

    results.forEach(row => {
      if (!timetable[row.section_name]) timetable[row.section_name] = {};
      if (!timetable[row.section_name][row.day_of_week]) timetable[row.section_name][row.day_of_week] = {};
      
      timetable[row.section_name][row.day_of_week][row.start_time] = {
        id: row.class_id,
        subject: row.subject,
        // Map the joined string name back to the 'teacher' property the UI expects
        teacher: row.teacher_name || "Unassigned", 
        teacher_id: row.teacher_id, 
        room: row.room_number,
        section: row.section_name,
        color: "#3b82f6" // Fallback color for the UI cards
      };
    });

    res.json({ timetable });
  });
});

// POST: Find relief teachers based on a leave request date
app.post("/allocate-relief", (req, res) => {
  // Now expecting the exact data format from your leaves table
  const { teacher_id, leave_date } = req.body; 

  if (!teacher_id || !leave_date) {
    return res.status(400).json({ message: "Missing teacher_id or leave_date." });
  }

  // 1. Convert the leave_date (e.g., '2026-07-24') to a day of the week (e.g., 'Friday')
  const dateObj = new Date(leave_date);
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const day_of_week = daysOfWeek[dateObj.getDay()];

  if (day_of_week === "Sunday" || day_of_week === "Saturday") {
    return res.status(200).json({ message: "Weekend leave. No relief allocation needed.", allocations: [] });
  }

  // 2. Get all classes the absent teacher was supposed to teach on that specific day
  const getScheduleQuery = `
    SELECT class_id, section_name, start_time, subject, room_number
    FROM timetables
    WHERE teacher_id = ? AND day_of_week = ?
  `;

  db.query(getScheduleQuery, [teacher_id, day_of_week], async (err, classesToCover) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });

    if (classesToCover.length === 0) {
      return res.status(200).json({ 
        message: `Teacher ${teacher_id} has no classes scheduled on ${day_of_week}s.`, 
        allocations: [] 
      });
    }

    try {
      // 3. Loop through each class to find available substitutes
      const allocationPromises = classesToCover.map((cls) => {
        return new Promise((resolve, reject) => {
          
          const findSubstituteQuery = `
            SELECT id, name, subject_specialty,
              CASE WHEN subject_specialty LIKE ? THEN 1 ELSE 2 END as priority_level
            FROM teachers
            WHERE status = 'Active' 
              AND id != ? 
              AND id NOT IN (
                SELECT teacher_id 
                FROM timetables 
                WHERE day_of_week = ? AND start_time = ? AND teacher_id IS NOT NULL
              )
            ORDER BY priority_level ASC, name ASC
          `;

          const subjectSearch = `%${cls.subject}%`;

          db.query(findSubstituteQuery, [subjectSearch, teacher_id, day_of_week, cls.start_time], (err, availableTeachers) => {
            if (err) return reject(err);

            const priority1 = availableTeachers.filter(t => t.priority_level === 1);
            const priority2 = availableTeachers.filter(t => t.priority_level === 2);

            resolve({
              time_slot: cls.start_time,
              section: cls.section_name,
              subject_to_cover: cls.subject,
              room: cls.room_number,
              // Prioritize same subject, fallback to different subject
              assigned_substitutes: priority1.length > 0 ? priority1 : priority2,
              priority_used: priority1.length > 0 ? "Same Subject" : "Different Subject",
              is_uncovered: availableTeachers.length === 0
            });
          });
        });
      });

      const allocations = await Promise.all(allocationPromises);
      
      res.status(200).json({ 
        message: `Relief allocation generated for ${day_of_week}, ${leave_date}`, 
        allocations 
      });

    } catch (error) {
      console.error("Relief Allocation Error:", error);
      res.status(500).json({ message: "Failed to process relief allocation", error });
    }
  });
});


// POST: Save the confirmed relief allocations to the teacher_timetable
// POST: Save the confirmed relief allocations to the teacher_timetable
app.post("/confirm-relief", (req, res) => {
  const { absent_teacher_id, day_of_week, assignments } = req.body;
  
  if (!absent_teacher_id || !day_of_week || !assignments || assignments.length === 0) {
    return res.status(400).json({ message: "Missing required relief assignment data." });
  }

  const timeColumnMap = {
    "07:45": "7:45 - 8:25 AM",
    "08:25": "8:25 - 9:05 AM",
    "09:05": "9:05 - 9:45 AM",
    "09:45": "9:45 - 10:25 AM",
    "10:25": "10:25 - 11:05 AM",
    "11:05": "11:05 - 11:30 AM",
    "11:30": "11:30 - 12:10 PM",
    "12:10": "12:10 - 12:50 PM",
    "12:50": "12:50 - 1:30 PM"
  };

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: "Database connection error" });

    connection.beginTransaction(async (err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ message: "Transaction start failed" });
      }

      try {
        for (const assignment of assignments) {
          const columnName = timeColumnMap[assignment.time_slot];
          if (!columnName) continue; 

          // 1. Update the Absent Teacher's schedule to show they are on leave
          const clearAbsentQuery = `
            UPDATE teacher_timetable 
            SET \`${columnName}\` = 'On Leave' 
            WHERE teacher_id = ? AND day_of_week = ?
          `;
          await new Promise((resolve, reject) => {
            connection.query(clearAbsentQuery, [absent_teacher_id, day_of_week], (err) => err ? reject(err) : resolve());
          });

          // 2. Safely Update the Substitute Teacher
          if (assignment.substitute_id) {
            
            // Check if the substitute teacher has a row for this day in teacher_timetable
            const checkRowQuery = `SELECT id FROM teacher_timetable WHERE teacher_id = ? AND day_of_week = ?`;
            const existingRows = await new Promise((resolve, reject) => {
              connection.query(checkRowQuery, [assignment.substitute_id, day_of_week], (err, results) => err ? reject(err) : resolve(results));
            });

            // If they don't have a row (because they were fully free that day), create one
            if (existingRows.length === 0) {
              const insertBlankRowQuery = `
                INSERT INTO teacher_timetable 
                (teacher_id, day_of_week, \`7:45 - 8:25 AM\`, \`8:25 - 9:05 AM\`, \`9:05 - 9:45 AM\`, \`9:45 - 10:25 AM\`, \`10:25 - 11:05 AM\`, \`11:05 - 11:30 AM\`, \`11:30 - 12:10 PM\`, \`12:10 - 12:50 PM\`, \`12:50 - 1:30 PM\`)
                VALUES (?, ?, 'Free', 'Free', 'Free', 'Free', 'Free', 'Interval', 'Free', 'Free', 'Free')
              `;
              await new Promise((resolve, reject) => {
                connection.query(insertBlankRowQuery, [assignment.substitute_id, day_of_week], (err) => err ? reject(err) : resolve());
              });
            }

            // Now safely apply the relief assignment
            const assignSubQuery = `
              UPDATE teacher_timetable 
              SET \`${columnName}\` = ? 
              WHERE teacher_id = ? AND day_of_week = ?
            `;
            const reliefText = `Relief: ${assignment.section}`; 
            
            await new Promise((resolve, reject) => {
              connection.query(assignSubQuery, [reliefText, assignment.substitute_id, day_of_week], (err) => err ? reject(err) : resolve());
            });
          }
        }

        connection.commit((err) => {
          if (err) throw err;
          connection.release();
          res.status(200).json({ message: "Relief timetable updated successfully." });
        });

      } catch (error) {
        connection.rollback(() => {
          connection.release();
          console.error("Relief Update Error:", error);
          res.status(500).json({ message: "Failed to update relief schedules", error: error.message });
        });
      }
    });
  });
});

// GET: Fetch approved leave requests for the Principal to assign relief
app.get("/approved-leaves", (req, res) => {
  const sql = `
    SELECT l.id, l.teacher_id, t.name AS teacher_name, l.leave_date, l.reason, l.status
    FROM leave_requests l
    JOIN teachers t ON l.teacher_id = t.id
    WHERE l.status = 'approved'
    ORDER BY l.leave_date ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Failed to fetch leaves:", err);
      return res.status(500).json({ error: "Failed to fetch leave requests" });
    }
    res.json(results);
  });
});

// GET: Fetch pending leave requests with Teacher ID and Name for Principal
app.get("/principal/pending-leaves", (req, res) => {
  const sql = `
    SELECT 
      lr.id, 
      lr.teacher_id, 
      t.name AS teacher_name, 
      lr.leave_type, 
      lr.leave_date, 
      lr.reason, 
      lr.status
    FROM leave_requests lr
    JOIN teachers t ON lr.teacher_id = t.id
    WHERE lr.status = 'pending'
    ORDER BY lr.submitted_at DESC
  `;
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data);
  });
});


// GET: Fetch approved leave requests for Principal
app.get("/principal/approved-leaves", (req, res) => {
    const sql = `
        SELECT
            lr.id,
            lr.teacher_id,
            t.name AS teacher_name,
            lr.leave_type,
            lr.leave_date,
            lr.reason,
            lr.status
        FROM leave_requests lr
        JOIN teachers t ON lr.teacher_id = t.id
        WHERE lr.status = 'approved'
        ORDER BY lr.leave_date DESC
    `;
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// PUT: Approve or Reject a leave request & send email
app.put("/leave-requests/:id/status", (req, res) => {
    const requestId = req.params.id;
    const { status } = req.body;

    // 1. Get teacher email and details
    const getTeacherSql = `
        SELECT t.email, t.name, lr.leave_type, lr.leave_date 
        FROM leave_requests lr 
        JOIN teachers t ON lr.teacher_id = t.id 
        WHERE lr.id = ?
    `;

    db.query(getTeacherSql, [requestId], (err, results) => {
        if (err || results.length === 0) {
            console.error("Error fetching teacher details:", err);
            return res.status(500).json({ error: "Failed to fetch teacher details" });
        }

        const teacher = results[0];

        // 2. Update status in database
        const updateSql = `UPDATE leave_requests SET status = ? WHERE id = ?`;
        db.query(updateSql, [status, requestId], (updateErr) => {
            if (updateErr) {
                console.error("Error updating status:", updateErr);
                return res.status(500).json({ error: "Failed to update status" });
            }

            // 3. Send Email Notification
            const mailOptions = {
                from: '"School Admin" <your.school.system.email@gmail.com>',
                to: teacher.email,
                subject: `Leave Request ${status.toUpperCase()}`,
                text: `Dear ${teacher.name},\n\nYour leave request for ${teacher.leave_type} on ${teacher.leave_date} has been ${status}.\n\nRegards,\nSchool Administration`
            };

            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) {
                    console.error("❌ Email sending failed:", mailErr);
                    // Still return success to front end, but log the error
                    return res.json({ message: "Status updated, but email failed to send.", error: mailErr });
                }
                console.log("✅ Email sent successfully:", info.response);
                return res.json({ message: "Status updated and email sent successfully!" });
            });
        });
    });
});

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "rathnayakeanidu@gmail.com", // Your sending Gmail address
    pass: "hdraskmsrbtqemal"                  // 16-character Google App Password
  }
});

app.get("/timetable/:classId", (req, res) => {
  const classId = req.params.classId;

  // Updated to match your exact DB schema
  const sql = "SELECT * FROM timetables WHERE section_name = ?";

  db.query(sql, [classId], (err, result) => {
    if (err) {
      console.error("Database error fetching timetable:", err);
      return res.status(500).json({ error: "Database error" });
    }
    return res.json(result);
  });
});

// GET: Check if a teacher has an assigned homeroom in the 'classes' table
app.get("/api/teacher-homeroom/:teacherId", (req, res) => {
  const teacherId = req.params.teacherId;
  const sql = "SELECT class_name FROM classes WHERE homeroom_teacher_id = ?";
  
  db.query(sql, [teacherId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    
    if (results.length > 0 && results[0].class_name) {
      res.json({ hasHomeroom: true, className: results[0].class_name });
    } else {
      res.json({ hasHomeroom: false, className: null });
    }
  });
});



// Fetch all subjects for dropdowns
app.get('/subjects', (req, res) => {
    db.query('SELECT * FROM curriculum_subjects', (err, results) => {
        if (err) {
            console.error("Error fetching subjects:", err);
            return res.status(500).json({ error: "Failed to fetch subjects" });
        }
        res.json(results);
    });
});