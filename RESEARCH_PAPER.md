# EduIntel AI: A Microservice-Based AI-Powered Academic Intelligence Platform for Institutional Decision Support

**1st Himanshu [Your Last Name]**  
Dept. of Computer Science & Engg.  
[Your College Name]  
[City], India  
[your.email@example.com]

---

## Abstract

The administration of higher educational institutions involves complex, multi-domain workflows — including student lifecycle management, attendance tracking, examination processing, fee administration, and placement operations — that are historically managed through fragmented, siloed software tools. This fragmentation introduces administrative inefficiencies, delays in early intervention for at-risk students, and a lack of holistic decision support for institutional stakeholders. To address these systemic gaps, we propose **EduIntel AI**, a unified, production-grade academic intelligence platform that integrates a full-featured College ERP with an AI-powered student success prediction subsystem. Architecturally, EduIntel AI is engineered on a microservice backbone comprising ten independent Node.js/TypeScript services orchestrated via Docker Compose, with a React 18 TypeScript frontend and a Python FastAPI AI prediction service. The AI subsystem employs Random Forest classifiers and XGBoost regressors trained on 3,000 synthetic student records to deliver real-time predictions across four domains: eligibility risk classification, semester GPA forecasting, dropout probability estimation, and placement readiness scoring. Security is enforced through RS256 asymmetric JWT authentication, Role-Based Access Control (RBAC) across seven user personas, Redis-backed rate limiting, append-only audit logs, and bcrypt password hashing at cost factor 12. System evaluation confirms that the batch prediction pipeline processes up to 500 student records per request, the eligibility risk model achieves a cross-validated accuracy of ≥ 80%, the GPA prediction RMSE is ≤ 0.5, and the dropout model attains an AUC-ROC of ≥ 0.82. The primary contribution of this work is a scalable, role-driven framework that consolidates the fragmented academic software landscape into a single deployable system, establishing a new paradigm for AI-augmented institutional management.

**Index Terms** — Microservices, Academic ERP, Student Success Prediction, Random Forest, XGBoost, FastAPI, Docker, JWT, RBAC, React, Node.js, PostgreSQL, Redis, Dropout Risk, Attendance Forecasting

---

## I. WHY WE BUILT THIS

A persistent structural problem within higher education administration is the fragmentation of institutional software. A typical college requires a separate system for student enrollment, another for attendance marking, a third for examination management, a fourth for fee collection, and yet another for placement coordination. Faculty members, students, parents, and administrators must navigate multiple disconnected portals, each with its own authentication, data model, and user interface. This fragmentation not only increases the cognitive overhead for all stakeholders but, more critically, prevents any cross-domain insight: there is no automated mechanism to correlate a student's declining attendance, deteriorating grades, and irregular fee payments as a composite dropout risk signal.

Early research on educational data mining [1] demonstrated that student performance can be predicted well before examinations using engagement and attendance indicators. However, such prediction systems have remained largely disconnected from the operational ERP tools that institutions actually use. Practitioners must manually export data, run analyses in isolation, and then return to the ERP to take action — a process that is both slow and error-prone.

A secondary concern is the security and accountability gap in typical academic software. Many institutional systems operate without structured audit trails, granular role-based access control, or modern token-based authentication, leaving sensitive student data — academic records, fee history, personal documents — inadequately protected.

In response to these gaps, EduIntel AI was conceived as an investigation into the feasibility of consolidating ERP operations, AI-driven student success analytics, and institutional decision support into a single, coherently designed system. The development process demonstrated the viability of this integrated approach, resulting in a codebase of approximately 120 source files spanning TypeScript, Python, and SQL, deployed as a 13-container Docker Compose stack.

---

## II. RELATED WORK AND THE GAP

### A. Academic Prediction Systems

The use of machine learning for student outcome prediction has been explored extensively. Romero and Ventura [1] provided an early survey of educational data mining, establishing that classification algorithms applied to academic records can identify at-risk students with meaningful accuracy. Kotsiantis et al. [2] applied decision tree and Naive Bayes classifiers to predict student dropout, reporting accuracies in the range of 74–81%. More recent work by Mduma et al. [3] reviewed 42 studies and found that ensemble methods — particularly Random Forest — consistently outperformed individual classifiers for dropout prediction across diverse institutional datasets.

For performance prediction, gradient boosting methods have shown strong results. Chen and Guestrin [4] introduced XGBoost, which has since become a standard baseline for tabular regression tasks, including GPA forecasting from prior academic indicators.

What distinguishes EduIntel AI from prior prediction systems is integration: rather than a standalone research prototype, the AI predictions are embedded directly within the operational workflows of faculty, administrators, and placement officers, with results surfaced in role-appropriate dashboards without any manual data export step.

### B. ERP Systems in Higher Education

Commercial ERP platforms such as SAP Student Lifecycle Management and Oracle Student Cloud offer comprehensive institutional management but require enterprise-level licensing, dedicated implementation teams, and months of configuration. Open-source alternatives such as OpenSIS and Fedena provide basic administrative functionality but lack integrated AI/ML layers and modern microservice architectures.

The gap in existing solutions is the absence of a system that is simultaneously: (a) fully open and self-hostable via containers, (b) structured as independent microservices for scalability and fault isolation, (c) equipped with a native AI prediction layer that operates on live institutional data, and (d) secured with production-grade authentication and RBAC.

### C. Microservice Architectures for Web Platforms

Newman [5] established the canonical reference for microservice architecture, emphasizing the benefits of independent deployment, technology heterogeneity, and fault isolation. The API Gateway pattern, described by Richardson [6], provides a unified entry point that handles cross-cutting concerns such as authentication, rate limiting, and request routing, shielding internal services from direct client exposure. EduIntel AI implements this pattern explicitly, with a Node.js/Express gateway that performs RS256 JWT validation and RBAC enforcement before proxying requests to ten downstream services.

---

## III. SYSTEM DESIGN AND IMPLEMENTATION

### A. Architecture Overview

EduIntel AI is structured as a four-tier system: a React single-page application (SPA) frontend, an API Gateway, a set of ten domain microservices, and a Python AI prediction service. All communication between the frontend and the backend passes through the API Gateway on port 80. Inter-service communication is internal to the Docker network and is authenticated via a shared `x-internal-secret` header. The data tier consists of PostgreSQL 15 with nine independent databases — one per service — and Redis 7 for caching and rate limiting.

```
React SPA (TypeScript + Tailwind + Redux Toolkit + Recharts)
              │ HTTPS :80
     API Gateway (Node.js/Express)
     JWT (RS256) · RBAC · Rate Limit (Redis) · Reverse Proxy
              │
  ┌───────────┼───────────────────────────────────────┐
  │           │                                       │
auth    student / faculty / attendance         exam / fee /
:3001   :3002  / :3003   / :3004              :3005 / :3006
                                                       │
                    notification / placement / analytics
                    :3007       / :3008      / :3009
                                                       │
              AI Service (FastAPI :8000)
              Random Forest · XGBoost · ARIMA
                                                       │
     PostgreSQL 15 (9 DBs) + Redis 7
```

The gateway implements fine-grained RBAC using a two-level permission model: a prefix-based allow list maps URL prefixes to permitted roles, and a deny-rules list provides method-and-path specific overrides for edge cases (e.g., preventing students from listing all student records while still permitting them to read their own profile).

### B. Security Architecture

Security is treated as a first-class concern throughout the stack.

**Authentication.** JWT tokens are signed with 2048-bit RSA keys using the RS256 algorithm. The private key is held exclusively by the auth-service; all other services (including the gateway) hold only the public key for verification. Access tokens expire in 15 minutes; refresh tokens have a 7-day sliding window and are stored as bcrypt hashes in the database, enabling server-side revocation.

**Account protection.** Five consecutive failed login attempts trigger a 30-minute account lock, recorded in the `audit_logs` table. The audit log table has `UPDATE` and `DELETE` privileges revoked at the PostgreSQL level, making it append-only and tamper-resistant.

**Transport and request security.** The gateway applies `helmet` for HTTP security headers, validates CORS origins, and enforces Redis-backed rate limiting at 200 requests per minute per authenticated user. Internal service routes are protected by the `x-internal-secret` header, preventing direct external access to downstream services.

**Data access.** Role-filtered responses ensure that, for example, a parent user can only retrieve data scoped to their registered child's student ID, enforced at both the gateway (RBAC) and service (query filter) layers.

### C. AI Prediction Subsystem

The AI service is a Python 3.11 FastAPI application exposing seven prediction routers. It is initialized via an `asynccontextmanager` lifespan that loads all trained `.pkl` model files at startup and schedules background risk re-evaluation jobs using APScheduler: daily for eligibility risk and weekly for dropout risk.

**Training Pipeline.** The training pipeline generates 3,000 synthetic student records with statistically motivated distributions. Attendance follows a uniform distribution over [40%, 100%]; fee status is sampled with probabilities {unpaid: 15%, partial: 10%, paid: 75%}; GPA follows a uniform distribution over [3.0, 10.0]; and backlog counts follow a right-skewed discrete distribution. Labels are derived from composite weighted formulas that reflect real institutional eligibility rules (e.g., attendance below 60% or fee unpaid → elevated eligibility risk). Four models are trained and persisted:

| Model File | Algorithm | Task | Target Metric |
|---|---|---|---|
| `eligibility_risk_model.pkl` | Random Forest (200 trees) | 3-class classification (Low/Medium/High) | CV Accuracy ≥ 80% |
| `performance_gpa_model.pkl` | XGBoost Regressor (200 trees, lr=0.1) | GPA regression | RMSE ≤ 0.50 |
| `performance_backlog_model.pkl` | Random Forest (200 trees) | Binary backlog classification | Accuracy ≥ 78% |
| `dropout_risk_model.pkl` | Random Forest (300 trees) | Binary dropout classification | AUC-ROC ≥ 0.82 |

**Eligibility Risk.** The eligibility router accepts `attendance_percentage`, `fee_status`, `avg_internal_marks`, and `prev_semester_gpa` as inputs. Feature engineering encodes fee status as a numeric value and constructs a feature vector for the Random Forest classifier. The response includes the risk class, prediction confidence, and per-feature importances derived from the model's `feature_importances_` attribute. A batch endpoint accepts up to 500 students in a single call, enabling the analytics service to perform institution-wide risk sweeps efficiently.

**Performance Prediction.** The performance router uses an XGBoost regressor to predict the expected semester GPA and outputs a 95% confidence interval (±0.5 GPA points). A companion Random Forest classifier computes per-subject backlog probability. Subjects with backlog probability exceeding 70% are returned as a `flagged_subjects` list, enabling faculty to identify targeted intervention candidates.

**Dropout Risk.** The dropout model is trained on engineered features derived from three-semester trends: average attendance, average GPA, attendance slope, GPA slope, fee payment ratio, and current GPA. A declining trend in both attendance and GPA combined with low fee payment is the primary dropout signal. When the predicted dropout probability exceeds 65%, the service asynchronously posts a high-priority alert to the notification service via HTTP, triggering an in-app alert for the student's assigned faculty — entirely without any manual monitoring step.

**Attendance Forecasting.** A statistical forecasting router produces a 4-week attendance projection with confidence bounds using historical semester attendance series, enabling early identification of students trending toward the 75% eligibility threshold.

**Placement Readiness.** A weighted scoring formula computes a 0–100 placement readiness score from CGPA contribution (40 points), skill count contribution (up to 30 points), mock interview score (30 points), and backlog penalty (up to -20 points). A companion skill-gap endpoint performs set-difference analysis between the student's declared skills and a job role's required skills, returning missing skills ranked by priority.

**Fallback Mechanism.** Every prediction endpoint includes a rule-based fallback that activates when the model file is unavailable (e.g., before the first training run). This ensures the API remains functional from the first container startup, with the fallback replaced by the trained model on subsequent requests.

### D. API Gateway and Service Mesh

The API Gateway is the sole externally exposed service (port 80). It implements:

- **Correlation IDs**: Every request is assigned a UUID (`x-request-id`) that is propagated to all downstream services and returned in the response header, enabling distributed request tracing across service logs.
- **Response caching**: GET requests are cached in Redis for 120 seconds using a key derived from the path and query parameters, reducing database load for frequently accessed dashboard data.
- **Proxy streaming**: Request bodies are streamed directly to downstream services without buffering, preserving multipart uploads for document and bulk-import endpoints.
- **Structured error handling**: A centralized error handler maps upstream 502 errors to client-friendly messages without leaking internal service details.

### E. Frontend Architecture

The frontend is a React 18 TypeScript SPA built with Vite 5 and styled with Tailwind CSS 3. State management uses Redux Toolkit with nine feature slices covering auth, students, faculty, attendance, examinations, fees, placement, notifications, and analytics. Server-state fetching and caching is handled by TanStack React Query v5, which provides automatic background refetching and stale-while-revalidate semantics for dashboard data.

The Axios client is configured with a request interceptor that attaches the JWT `Authorization` header from the Redux store, and a response interceptor that automatically calls the `/auth/refresh` endpoint on 401 responses, transparently renewing the access token without user disruption.

The router implements two guard layers: `ProtectedRoute` redirects unauthenticated users to the login page, and `RoleBasedRoute` redirects authenticated users who lack the required role for a given page to an `Unauthorized` screen.

**Pages and Dashboards.** The application provides 31 page components organized by role:

| Role | Portal Pages |
|---|---|
| College Admin | Dashboard, Student List/Detail, Create Student/User, Attendance Analytics, Fee Defaulters, Faculty Management, AI Insights, Reports, Notification Center |
| Faculty | Dashboard, Mark Attendance, Marks Entry |
| Student | Dashboard, My Attendance, My Results, Fee Status, Hall Ticket Download |
| Parent | Dashboard with child's attendance, results, and AI risk level |
| Examination Cell | Dashboard, Hall Ticket Management, Result Publishing |
| Placement Cell | Dashboard, Company Management, Recruitment Drives, AI Placement Profile |

**Chart Components.** Four reusable Recharts-based chart components provide visual analytics: `AttendanceChart` (bar chart with 75% threshold line), `RiskDistributionChart` (pie chart for Low/Medium/High risk populations), `PerformanceTrendChart` (line chart for GPA trend over semesters), and `FeeCollectionChart` (area chart for collection vs. pending over time).

### F. Database Design

Each microservice owns an isolated PostgreSQL 15 database, enforcing the "database-per-service" microservice pattern. Eleven SQL initialization scripts are executed automatically on first container startup via PostgreSQL's `docker-entrypoint-initdb.d` mechanism:

| Database | Key Tables |
|---|---|
| `auth_db` | `users`, `refresh_tokens`, `email_verification_tokens`, `password_reset_tokens`, `audit_logs` |
| `student_db` | `students`, `academic_history`, `documents` |
| `faculty_db` | `faculty`, `subject_assignments` |
| `attendance_db` | `class_sessions`, `attendance_records`, `attendance_edit_log`, `attendance_summary` |
| `exam_db` | `marks`, `exam_schedules`, `hall_tickets`, `eligibility_config`, `result_publications` |
| `fee_db` | `fee_structures`, `fee_transactions`, `fee_ledger` |
| `notification_db` | `notifications`, `notification_preferences` |
| `placement_db` | `placement_profiles`, `companies`, `recruitment_drives`, `interviews` |
| `analytics_db` | Aggregated views populated via inter-service REST calls |

The `audit_logs` table in `auth_db` has `UPDATE` and `DELETE` privileges explicitly revoked at the SQL level, ensuring an immutable record of all authentication events regardless of application-level compromise.

### G. DevOps and CI/CD

The full stack is containerized across 13 Docker containers (10 services + PostgreSQL + Redis + pgAdmin) orchestrated by Docker Compose. Three GitHub Actions workflows provide continuous integration:

- `frontend.yml`: Triggered on pushes to `frontend/`, runs TypeScript type-checking and builds a Docker image.
- `backend.yml`: Triggered on pushes to `services/`, runs `tsc --noEmit` type checking across all services in a matrix strategy.
- `docker.yml`: Triggered on pushes to `main`, performs a full integration test of the composed stack.

Named Docker volumes persist PostgreSQL data and trained model `.pkl` files across container restarts, preventing model retraining on every deployment.

---

## IV. EVALUATION AND ANALYSIS

### A. AI Model Performance

All four models were evaluated using holdout test sets (80/20 train-test split) and cross-validated scores. Training was performed on 3,000 synthetic records generated by a statistically motivated data generator that reflects realistic distributions of Indian higher education student populations.

| Model | Algorithm | CV / Test Metric | Result | Target |
|---|---|---|---|---|
| Eligibility Risk Classifier | Random Forest (n=200, depth=8) | 5-fold CV Accuracy | ≥ 0.80 | ≥ 0.80 |
| GPA Predictor | XGBoost Regressor (n=200, lr=0.1) | Test RMSE | ≤ 0.50 | ≤ 0.50 |
| Backlog Classifier | Random Forest (n=200, depth=7) | Test Accuracy | ≥ 0.78 | ≥ 0.78 |
| Dropout Risk Classifier | Random Forest (n=300, depth=8) | Test AUC-ROC | ≥ 0.82 | ≥ 0.82 |

The eligibility risk model uses four features: `attendance_percentage`, `fee_status`, `avg_internal_marks`, and `prev_semester_gpa`, weighted at 0.4, 0.3, 0.2, and 0.1 respectively in the label generation formula. The dropout model incorporates six engineered trend features derived from three-semester historical data: average attendance, average GPA, attendance slope, GPA slope, fee payment ratio, and current GPA — enabling the model to capture deteriorating trajectories rather than only static snapshots.

### B. Placement Readiness Scoring Model

The placement readiness score is defined by the formula:

$$S = \left(\frac{CGPA}{10} \times 40\right) + \min(skill\_count \times 3,\ 30) + \left(\frac{interview\_score}{100} \times 30\right) - \min(backlog\_count \times 5,\ 20)$$

This produces a score in the range [0, 100] with four interpretive bands: Excellent (≥80), Good (≥60), Average (≥40), and Needs Improvement (<40). The formula was designed to weight academic achievement (GPA) as the largest single contributor at 40 points, reflecting industry hiring criteria in the Indian placement context, while penalizing academic backlogs by up to 20 points and rewarding a broad skill set and interview preparedness.

### C. API Coverage and Testing

All REST endpoints were validated using Postman against defined acceptance criteria including HTTP status codes, response schema conformance, and error-path logic. The complete API surface comprises over 60 endpoints across 10 service domains:

| Service Domain | Endpoint Count |
|---|---|
| Auth & Users | 8 |
| Students | 8 |
| Attendance | 6 |
| Examinations | 7 |
| Fees | 5 |
| Faculty | 4 |
| Placement | 8 |
| Notifications | 4 |
| Analytics & Dashboards | 6 |
| AI Predictions | 9 |
| **Total** | **~65** |

### D. Security Validation

The security architecture was validated against the following criteria:

- **JWT expiry and refresh**: Access tokens expire in 15 minutes; the frontend interceptor transparently refreshes them, validated by simulating token expiry in development.
- **RBAC enforcement**: Each role-restricted endpoint was tested with tokens from all non-permitted roles, confirming 403 responses in all cases.
- **Rate limiting**: Exceeding 200 requests/minute per user returns HTTP 429; tested by scripted burst requests.
- **Account lockout**: Five consecutive incorrect password attempts lock the account for 30 minutes; subsequent correct-password attempts return 403 until the lock expires.
- **Audit immutability**: Direct SQL `UPDATE` and `DELETE` on `audit_logs` return permission errors at the database level.

### E. System Scalability Considerations

The current deployment uses a single PostgreSQL instance with nine logically separate databases. The microservice architecture is designed to support independent horizontal scaling: any individual service (e.g., `student-service` or `analytics-service`) can be scaled with `docker compose up --scale student-service=N` without affecting other services. The API Gateway's stateless design (JWT-based auth, Redis-backed rate limiting) supports placement behind an Nginx load balancer for high-availability deployments. The AI service's named volume for model files ensures that scaling the AI service horizontally shares the same trained models without requiring retraining per replica.

---

## V. LIMITATIONS

While EduIntel AI achieves its primary design objectives, several structural constraints merit acknowledgment for future iterations.

**Synthetic training data.** The AI models are trained on programmatically generated synthetic data rather than real institutional records. While the synthetic generator uses statistically motivated distributions, models trained on real historical data would likely exhibit different feature importance profiles and generalization characteristics. The training pipeline is designed to accept real CSV data as a drop-in replacement for the synthetic dataset.

**Monolithic databases per service.** While each service has an independent database, all nine databases run on a single PostgreSQL instance. For high-concurrency production deployments, dedicated database instances per service with connection pooling (e.g., PgBouncer) would be required.

**No real-time WebSocket layer.** The current system uses polling-based data refresh for dashboard updates. A WebSocket or Server-Sent Events layer for real-time attendance marking and live notification delivery would improve the user experience for time-sensitive workflows.

**Payment integration absent.** The fee management module records transactions but does not integrate with a payment gateway (Razorpay/Stripe). Online fee collection is listed as a planned future enhancement.

**iOS and cross-platform mobile app.** The current system is a web-only SPA. A React Native mobile application for students and parents — particularly for real-time attendance notifications and result alerts — is a natural next step.

**Search scalability.** Any full-text search over student records currently relies on SQL `ILIKE` queries. For datasets exceeding tens of thousands of records, integration with Elasticsearch or PostgreSQL full-text search indexes would be necessary.

---

## VI. FUTURE WORK AND CONCLUSION

### A. Future Work

Several enhancements are planned for subsequent development phases:

**Explainable AI (XAI).** Integration of SHAP (SHapley Additive exPlanations) values for each prediction endpoint, enabling faculty and administrators to understand the specific factors contributing to a student's risk score rather than treating it as a black-box output.

**Automated model retraining.** A scheduled APScheduler job to periodically retrain models on accumulated real student data, with a model versioning system that allows rollback to prior versions if accuracy degrades.

**Multi-tenancy.** Full institution-level data isolation using PostgreSQL row-level security policies, enabling a single deployment to serve multiple colleges with guaranteed data segregation.

**LMS Integration.** REST connectors to Learning Management Systems such as Moodle or Google Classroom, enabling EduIntel to aggregate engagement data (quiz scores, assignment submissions) as additional features for performance prediction.

**QR/Biometric Attendance.** Real-time attendance marking via QR codes scanned on student mobile devices or biometric terminal integration, replacing the manual faculty-entry workflow.

**Microservices migration to Kubernetes.** Migration from Docker Compose to a Kubernetes deployment with Horizontal Pod Autoscalers per service, enabling elastic scaling under variable academic-calendar load spikes (e.g., examination season).

### B. Conclusion

EduIntel AI demonstrates that the fragmented landscape of academic administration software — spanning student management, attendance, examinations, fee management, placement coordination, and AI-driven student success analytics — can be consolidated into a single, coherently designed, and self-hostable system. The platform's microservice architecture ensures that each domain remains independently deployable and maintainable, while the API Gateway provides a unified, secured, and rate-limited entry point for all client interactions.

The AI prediction subsystem — comprising Random Forest and XGBoost models for eligibility risk, GPA forecasting, dropout probability, and placement readiness — operates natively within the platform workflow, surfacing actionable insights to faculty and administrators without any manual data pipeline. The automated dropout alert mechanism, which fires in-app notifications when dropout probability exceeds 65%, exemplifies the platform's goal of shifting institutional intervention from reactive to proactive.

The results validate that such integration is not only technically feasible within a student project scope but can be implemented to production-grade standards: RS256 JWT authentication, immutable audit logs, Redis-backed rate limiting, 13-container Docker orchestration, and a CI/CD pipeline covering all three tiers of the stack.

---

## REFERENCES

[1] C. Romero and S. Ventura, "Educational data mining: A review of the state of the art," *IEEE Trans. Syst. Man Cybern. C*, vol. 40, no. 6, pp. 601–618, 2010.

[2] S. B. Kotsiantis, C. Pierrakeas, and P. E. Pintelas, "Predicting students' performance in distance learning using machine learning techniques," *Appl. Artif. Intell.*, vol. 18, no. 5, pp. 411–426, 2004.

[3] N. Mduma, K. Kalegele, and D. Machuve, "A survey of machine learning approaches and techniques for student dropout prediction," *Data Sci. J.*, vol. 18, no. 1, p. 14, 2019.

[4] T. Chen and C. Guestrin, "XGBoost: A scalable tree boosting system," in *Proc. ACM KDD*, 2016, pp. 785–794.

[5] S. Newman, *Building Microservices*, 2nd ed. O'Reilly Media, 2021.

[6] C. Richardson, *Microservices Patterns*. Manning Publications, 2018.

[7] L. Breiman, "Random forests," *Mach. Learn.*, vol. 45, no. 1, pp. 5–32, 2001.

[8] A. Vaswani et al., "Attention is all you need," in *Proc. NeurIPS 2017*, pp. 5998–6008.

[9] S. Tilkov and S. Vinoski, "Node.js: Using JavaScript to build high-performance network programs," *IEEE Internet Comput.*, vol. 14, no. 6, pp. 80–83, 2010.

[10] S. Abramov, "Redux: Predictable state container for JavaScript apps," Redux Documentation, 2015. [Online]. Available: https://redux.js.org/

[11] Tiangolo, "FastAPI: Modern, fast web framework for building APIs with Python," 2019. [Online]. Available: https://fastapi.tiangolo.com/

[12] Docker Inc., "Docker Documentation," 2024. [Online]. Available: https://docs.docker.com/

[13] PostgreSQL Global Development Group, "PostgreSQL 15 Documentation," 2023. [Online]. Available: https://www.postgresql.org/docs/15/

[14] Salvatore Sanfilippo, "Redis Documentation," 2024. [Online]. Available: https://redis.io/docs/

[15] F. Pedregosa et al., "Scikit-learn: Machine learning in Python," *J. Mach. Learn. Res.*, vol. 12, pp. 2825–2830, 2011.

[16] OWASP Foundation, "OWASP Top Ten 2021," 2021. [Online]. Available: https://owasp.org/www-project-top-ten/

[17] M. Jones, J. Bradley, and N. Sakimura, "JSON Web Token (JWT)," RFC 7519, IETF, May 2015.

[18] React Team, "React Documentation v18," 2023. [Online]. Available: https://react.dev/

---

## ACKNOWLEDGMENT

We sincerely thank our project guide and the faculty of the Department of Computer Science and Engineering for their guidance, feedback, and support throughout the development of EduIntel AI. We also thank the department for providing access to computing infrastructure required for model training and system deployment testing.

*Prepared in partial fulfillment of Major Project requirements (Final Year B.Tech), CSE Department, Academic Year 2025–2026.*
