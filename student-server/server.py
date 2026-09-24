import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from ortools.sat.python import cp_model

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TeacherInfo(BaseModel):
    id: int | str
    name: str
    subject_specialty: Optional[str] = ""

class ClassInfo(BaseModel):
    id: str
    subject: str
    teacher: Optional[str] = "Unassigned"
    room: Optional[str] = "TBD"
    section: str 
    color: Optional[str] = "#3b82f6"
    periodsPerWeek: int

class GenerateRequest(BaseModel):
    classes: List[ClassInfo]
    teachers: List[TeacherInfo]
    days: List[str]
    timeSlots: List[str]

@app.post("/generate-schedule")
def generate_schedule(req: GenerateRequest):
    # --- 1. PRE-VALIDATION CHECKS (Robust whitespace handling) ---
    for c in req.classes:
        is_unassigned = not c.teacher or str(c.teacher).lower().strip() in ["unassigned", "tbd", "tba", "none", ""]
        
        # Check if the unassigned subject actually has a matching teacher in the database
        if is_unassigned:
            subj = c.subject.lower().strip()
            matches = [
                t for t in req.teachers 
                if subj in (t.subject_specialty or "").lower().strip() or (t.subject_specialty or "").lower().strip() in subj
            ]
            if not matches:
                return {
                    "status": "failed", 
                    "message": f"Cannot auto-assign: No teacher found with a specialty matching '{c.subject}'. Please add a teacher for this or assign manually."
                }

    # --- 2. SOLVER LOGIC ---
    model = cp_model.CpModel()
    x = {}
    y = {}
    
    for c in req.classes:
        for teacher in req.teachers:
            y[(c.id, teacher.id)] = model.NewBoolVar(f'assign_{c.id}_to_{teacher.id}')
            for d in req.days:
                for t in req.timeSlots:
                    x[(c.id, teacher.id, d, t)] = model.NewBoolVar(f'slot_{c.id}_{teacher.id}_{d}_{t}')

    # --- 3. TEACHER ASSIGNMENT RULES ---
    for c in req.classes:
        model.AddExactlyOne(y[(c.id, teacher.id)] for teacher in req.teachers)
        
        for teacher in req.teachers:
            for d in req.days:
                for t in req.timeSlots:
                    model.AddImplication(x[(c.id, teacher.id, d, t)], y[(c.id, teacher.id)])

        is_unassigned = not c.teacher or str(c.teacher).lower().strip() in ["unassigned", "tbd", "tba", "none", ""]
        
        for teacher in req.teachers:
            if not is_unassigned:
                # Force specific teacher if already assigned
                if str(c.teacher) == str(teacher.id) or c.teacher.lower().strip() == teacher.name.lower().strip():
                    model.Add(y[(c.id, teacher.id)] == 1)
            else:
                # Restrict to matching specialty
                subj = c.subject.lower().strip()
                spec = (teacher.subject_specialty or "").lower().strip()
                if subj not in spec and spec not in subj:
                    model.Add(y[(c.id, teacher.id)] == 0)

    # --- 4. TIMETABLE CONSTRAINTS ---
    for c in req.classes:
        model.Add(sum(x[(c.id, teacher.id, d, t)] for teacher in req.teachers for d in req.days for t in req.timeSlots) == c.periodsPerWeek)

    for c in req.classes:
        for d in req.days:
            model.Add(sum(x[(c.id, teacher.id, d, t)] for teacher in req.teachers for t in req.timeSlots) <= 2)

    for teacher in req.teachers:
        for d in req.days:
            for t in req.timeSlots:
                model.AddAtMostOne(x[(c.id, teacher.id, d, t)] for c in req.classes)

    for d in req.days:
        for t in req.timeSlots:
            rooms = set([c.room for c in req.classes if c.room and c.room.lower().strip() not in ["unassigned", "tbd", "tba", "no room", ""]])
            for room in rooms:
                room_classes = [c for c in req.classes if c.room == room]
                model.AddAtMostOne(x[(c.id, teacher.id, d, t)] for c in room_classes for teacher in req.teachers)

    for d in req.days:
        for t in req.timeSlots:
            sections = set([c.section for c in req.classes])
            for s in sections:
                section_classes = [c for c in req.classes if c.section == s]
                model.AddAtMostOne(x[(c.id, teacher.id, d, t)] for c in section_classes for teacher in req.teachers)

    # Max Workload (Full time limit)
    MAX_TEACHER_PERIODS = 30
    for teacher in req.teachers:
        model.Add(sum(x[(c.id, teacher.id, d, t)] for c in req.classes for d in req.days for t in req.timeSlots) <= MAX_TEACHER_PERIODS)

    # --- 5. EXECUTE SOLVER ---
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 15.0 
    status = solver.Solve(model)

    # --- 6. OUTPUT GENERATION ---
    timetable = {}
    unique_sections = set([c.section for c in req.classes])
    
    for s in unique_sections:
        timetable[s] = {day: {time: None for time in req.timeSlots} for day in req.days}
    
    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        class_lookup = {c.id: c for c in req.classes}
        teacher_lookup = {str(t.id): t for t in req.teachers}
        
        for c in req.classes:
            for teacher in req.teachers:
                for d in req.days:
                    for t in req.timeSlots:
                        if solver.Value(x[(c.id, teacher.id, d, t)]):
                            assigned_class = dict(class_lookup[c.id])
                            
                            # Give the frontend the name for the UI...
                            assigned_class['teacher'] = teacher_lookup[str(teacher.id)].name
                            
                            # ... AND explicitly attach the teacher_id for the Database!
                            assigned_class['teacher_id'] = int(teacher.id)
                            
                            timetable[c.section][d][t] = assigned_class
                            
        return {"status": "success", "timetable": timetable}
    else:
        return {"status": "failed", "message": "Constraint overlap. Workload limits exceeded or impossible room requirements."}
   
if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

    #uvicorn server:app --reload