"""Academic answers for Diploma/B.Tech questions. Optional Groq/OpenAI if a key is set."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

GUIDES = [
    (["pointer", "pointers"], "A pointer stores a memory address, not a normal value.\n\n• Declare: `int *p;`\n• Point to a variable: `p = &x;`\n• Read/write the value: `*p`\n• Arrays decay to pointers; `a[i]` is `*(a+i)`.\n• Always initialize pointers. Never dereference NULL.\nExam tip: draw the variable box and the address arrow before tracing code."),
    (["oop", "encapsulation", "inheritance", "polymorphism", "abstraction", "java"], "Java OOP has four pillars:\n\n1. Encapsulation — data + methods in a class; keep fields private.\n2. Inheritance — `extends` to reuse and specialize.\n3. Polymorphism — same method name, different behavior (`override`).\n4. Abstraction — hide details with abstract class or interface.\nExample: `Animal.speak()` overridden by `Dog` and `Cat`."),
    (["normalization", "1nf", "2nf", "3nf", "dbms", "database"], "Normalization removes repeating data.\n\n• 1NF — atomic values, no lists in a cell.\n• 2NF — 1NF + no partial key dependency.\n• 3NF — 2NF + no transitive dependency.\nExample: do not store student name + course teacher in one wide table; split Student, Course, Enrollment."),
    (["python", "list", "dictionary", "tuple"], "Python basics:\n\n• list — ordered, mutable: `[1, 2]`\n• tuple — ordered, immutable: `(1, 2)`\n• dict — key → value: `{\"name\": \"A\"}`\n• Indentation defines blocks.\nFunctions: `def add(a, b): return a + b`\nUse list comprehensions for short filters."),
    (["c programming", "c language", "scanf", "printf"], "C program structure: headers, `main()`, statements ending with `;`.\n\n• `printf` prints; `scanf` reads (pass addresses with `&`).\n• Data types: int, float, char, double.\n• Control: if/else, for, while, switch.\n• Functions must be declared before use or prototyped."),
    (["data structure", "linked list", "stack", "queue", "tree"], "Data structures store data with operations:\n\n• Array — fast index, fixed size.\n• Linked list — extra pointers, easy insert/delete.\n• Stack — LIFO (undo, recursion).\n• Queue — FIFO (printer, BFS).\n• Tree/Graph — hierarchy and networks.\nAlways state time complexity in exams (Big-O)."),
    (["algorithm", "complexity", "big-o", "sorting", "searching"], "An algorithm is a finite step-by-step method.\n\n• Time complexity describes growth with input size n.\n• O(1) constant, O(log n) binary search, O(n) linear, O(n log n) good sorts, O(n²) nested loops.\nWrite: idea → steps → example → complexity."),
    (["operating system", "process", "thread", "deadlock", "scheduling"], "OS manages CPU, memory, files, and devices.\n\n• Process = running program; thread = lightweight path inside it.\n• Scheduling: FCFS, SJF, Round Robin, Priority.\n• Deadlock needs mutual exclusion, hold-and-wait, no preemption, circular wait.\nAvoid deadlock by breaking one condition (e.g. resource ordering)."),
    (["computer network", "osi", "tcp", "ip", "http"], "Networks move packets between hosts.\n\nOSI: Physical, Data Link, Network, Transport, Session, Presentation, Application.\nTCP is reliable (connection); UDP is faster but no guarantee.\nIP addresses hosts; HTTP is an application protocol for the web.\nDNS maps names to IPs."),
    (["machine learning", "supervised", "unsupervised", "regression", "classification"], "ML learns patterns from data.\n\n• Supervised — labeled data (regression, classification).\n• Unsupervised — clusters, no labels.\n• Train/test split to check overfitting.\n• Accuracy is not enough on imbalanced data; also use precision/recall.\nStart with clean features before a complex model."),
    (["cloud", "virtualization", "docker", "kubernetes", "devops"], "Cloud rents compute/storage over the internet (IaaS, PaaS, SaaS).\n\nVirtualization: hypervisor runs VMs.\nContainers (Docker) package app + libs; Kubernetes schedules them.\nDevOps: CI/CD so code is tested and deployed often."),
    (["iot", "sensor", "arduino", "embedded", "mqtt"], "IoT connects sensors/actuators to the internet.\n\nTypical flow: sensor → microcontroller (Arduino/ESP) → network (Wi-Fi/MQTT) → cloud/app.\nEmbedded code is close to hardware (GPIO, timers).\nAlways plan power, security, and unique device IDs."),
    (["power system", "transformer", "induction motor", "power electronics"], "Electrical power: generation → transmission → distribution.\n\nTransformers change voltage with Faraday's law (no moving parts).\nInduction motors are the workhorse of industry (cheap, robust).\nPower electronics (diodes, thyristors, MOSFETs) convert AC/DC and control speed."),
    (["thermodynamics", "entropy", "heat transfer", "carnot"], "Thermodynamics studies energy and heat.\n\n• First law — energy is conserved (Q − W = ΔU).\n• Second law — entropy of an isolated system does not decrease; heat does not fully convert to work.\nCarnot cycle is the ideal heat-engine limit.\nHeat transfer modes: conduction, convection, radiation."),
    (["strength of materials", "stress", "strain", "bending", "torsion"], "Stress = force/area; strain = change in length / original length.\nHooke's law: σ = Eε in the elastic range.\nBeams: shear force and bending moment diagrams before finding bending stress (M y / I).\nTorsion of shafts: τ = T r / J."),
    (["matrix", "calculus", "derivative", "integral", "differential equation", "ode"], "Matrices: rows×columns; used for linear systems (AX=B).\nDerivative = rate of change; integral = accumulation/area.\nODE: equation with derivatives of one independent variable.\nFor exams: write formula, substitute values, box the unit."),
    (["probability", "statistics", "mean", "variance", "hypothesis"], "Probability is 0 to 1.\nMean = average; variance/std-dev = spread.\nIndependent events: P(A and B)=P(A)P(B).\nNormal distribution is the bell curve used in sampling.\nState H0/H1 clearly in hypothesis tests."),
    (["compiler", "automata", "dfa", "cfg", "lexical"], "Compilers: lexical analysis → parsing → semantic → optimize → code gen.\nDFA/NFA recognize regular languages.\nCFG describes nested syntax (programming languages).\nA token is the smallest meaningful unit (id, keyword, number)."),
    (["html", "css", "javascript", "web"], "Web pages: HTML structure, CSS look, JavaScript behavior.\nHTTP request/response; REST APIs use JSON.\nKeep secrets on the server, never in frontend JS.\nForms need validation on both client and server."),
    (["cyber", "cryptography", "encryption", "hash", "security"], "Confidentiality, integrity, availability.\nEncryption hides data (AES symmetric; RSA public-key).\nHashing is one-way (passwords: hash + salt, never store plain text).\nHTTPS = HTTP + TLS.\nNever share OTPs or passwords in chat."),
    (["vlsi", "digital", "flip flop", "logic gate", "verilog"], "Digital electronics: bits 0/1, gates AND OR NOT NAND NOR XOR.\nFlip-flops store 1 bit (SR, JK, D, T).\nCombinational vs sequential circuits.\nVLSI: many transistors on a chip; HDL (Verilog/VHDL) describes hardware."),
    (["fluid", "bernoulli", "reynolds", "hydraulics"], "Fluids have no fixed shape. Density ρ, viscosity μ.\nContinuity: A1V1=A2V2 (incompressible).\nBernoulli: along a streamline, pressure + kinetic + potential energy related.\nReynolds number tells laminar vs turbulent flow."),
]


def _local_answer(question: str) -> str:
    q = (question or "").strip().lower()
    if len(q) < 3:
        return "Ask a full academic question, for example: “Explain TCP vs UDP” or “What is normalization in DBMS?”"
    best_text = ""
    best_score = 0
    for keys, text in GUIDES:
        score = sum(2 if k in q else 0 for k in keys)
        if score > best_score:
            best_score = score
            best_text = text
    intro = f"Question: {question.strip()}\n\n"
    if best_score:
        return intro + best_text + "\n\nIf you need more, ask a follow-up with your exact formula, program, or numerical values."
    return (
        intro
        + "Study this topic in three layers:\n\n"
        + "1. Definition — say what it is in one sentence.\n"
        + "2. Working — list 4–6 steps or parts (with a small example).\n"
        + "3. Exam check — units, assumptions, time complexity, or a common mistake.\n\n"
        + "Relate it to your subject notes (formulas, diagrams, code). "
        "Reply with the subject name (for example OS, DBMS, Thermodynamics) and I will go deeper."
    )


def _remote_answer(question: str) -> str | None:
    groq = os.environ.get("GROQ_API_KEY", "").strip()
    openai = os.environ.get("OPENAI_API_KEY", "").strip()
    if groq:
        url = "https://api.groq.com/openai/v1/chat/completions"
        key = groq
        model = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
    elif openai:
        url = "https://api.openai.com/v1/chat/completions"
        key = openai
        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    else:
        return None
    payload = {
        "model": model,
        "temperature": 0.3,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are StudyConnectNG's academic tutor for Diploma and B.Tech students in India. "
                    "Answer only study questions: programming, maths, science, engineering, and related labs. "
                    "Be clear, stepwise, with a short example. Refuse non-academic or harmful requests. "
                    "Never ask for or show phone numbers."
                ),
            },
            {"role": "user", "content": question},
        ],
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + key},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"].strip()
    except (urllib.error.URLError, KeyError, IndexError, TimeoutError, json.JSONDecodeError):
        return None


def answer_question(question: str) -> str:
    remote = _remote_answer(question)
    if remote:
        return remote
    return _local_answer(question)
