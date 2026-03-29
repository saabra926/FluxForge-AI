"use strict";exports.id=405,exports.ids=[405],exports.modules={81430:(e,t,n)=>{n.d(t,{L:()=>m});var i=n(53797),r=n(77234),a=n(77210),o=n(98691),s=n(2021),l=n(71732);async function c(e){let t=await fetch("https://api.github.com/user/emails",{headers:{Authorization:`Bearer ${e}`,Accept:"application/vnd.github+json","User-Agent":"UI-Code-Generator-Pro"}});if(!t.ok)return null;let n=await t.json(),i=n.find(e=>e.primary),r=n.find(e=>e.verified);return(i??r??n[0])?.email??null}async function d(e,t){let n=e.access_token??void 0;if("github"===e.provider){let e=String(t.id??""),i=t.login??"user",r=t.email?.toLowerCase().trim();!r&&n&&(r=await c(n)??void 0),!r&&(r=`${e}+${i}@users.noreply.github.com`.toLowerCase());let a=await l.Z.findOne({githubId:e});return(a||(a=await l.Z.findOne({email:r})),a)?(a.githubId=e,a.githubLogin=i,a.githubAvatar=t.avatar_url??a.githubAvatar,a.githubAccessToken=n??a.githubAccessToken,!a.image&&t.avatar_url&&(a.image=t.avatar_url),!a.name&&i&&(a.name=i),await a.save(),a):l.Z.create({email:r,name:i,image:t.avatar_url,emailVerified:new Date,githubId:e,githubLogin:i,githubAvatar:t.avatar_url,githubAccessToken:n})}if("google"===e.provider){let e=t.sub??"",n=(t.email??"").toLowerCase().trim(),i=t.name,r=t.picture,a=await l.Z.findOne({googleId:e});return(!a&&n&&(a=await l.Z.findOne({email:n})),a)?(a.googleId=e,a.image=r??a.image,a.name=i??a.name,a.emailVerified||(a.emailVerified=new Date),await a.save(),a):l.Z.create({email:n,name:i??n.split("@")[0],image:r,emailVerified:new Date,googleId:e})}throw Error("Unsupported OAuth provider")}let u=!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET),p=!!(process.env.GITHUB_ID&&process.env.GITHUB_SECRET),m={providers:[...u?[(0,r.Z)({clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET})]:[],...p?[(0,a.Z)({clientId:process.env.GITHUB_ID,clientSecret:process.env.GITHUB_SECRET,authorization:{params:{scope:"read:user user:email"}}})]:[],(0,i.Z)({id:"credentials",name:"credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},async authorize(e){if(!e?.email||!e?.password)return null;await (0,s.u)();let t=await l.Z.findOne({email:String(e.email).toLowerCase().trim()});return t?.passwordHash&&await o.ZP.compare(String(e.password),t.passwordHash)?{id:t._id.toString(),email:t.email,name:t.name??void 0,image:t.image??void 0}:null}})],session:{strategy:"jwt",maxAge:2592e3,updateAge:86400},pages:{signIn:"/login",error:"/login"},callbacks:{async jwt({token:e,user:t,account:n,profile:i,trigger:r}){if(n&&i&&("github"===n.provider||"google"===n.provider)){await (0,s.u)();let t=await d(n,i);e.id=t._id.toString(),e.email=t.email,e.name=t.name??void 0,e.picture=t.image??void 0,e.githubLogin=t.githubLogin??void 0,e.githubLinked=!!t.githubId}else if(t){await (0,s.u)(),e.id=t.id,e.email=t.email,e.name=t.name,e.picture=t.image;let n=await l.Z.findById(t.id).lean();e.githubLogin=n?.githubLogin??void 0,e.githubLinked=!!n?.githubId}if("update"===r&&e.id){await (0,s.u)();let t=await l.Z.findById(e.id).lean();t&&(e.githubLogin=t.githubLogin??void 0,e.githubLinked=!!t.githubId,e.name=t.name??e.name,e.picture=t.image??e.picture)}return e},session:async({session:e,token:t})=>(e.user&&(e.user.id=t.id,e.user.githubLogin=t.githubLogin,e.user.githubLinked=t.githubLinked),e)},events:{async signOut({token:e}){e?.id&&(await (0,s.u)(),await l.Z.findByIdAndUpdate(e.id,{$unset:{githubAccessToken:""}}))}},secret:process.env.NEXTAUTH_SECRET}},29306:(e,t,n)=>{n.d(t,{R:()=>o,f:()=>a});let i=["PostgreSQL","MySQL","SQLite"],r=["MongoDB"];function a(e,t){return"Backend"===e||"Full Stack"===e||"Full Stack"===t||"Backend API"===t}function o(e){if(!e.category)return"Select a category.";if(!e.includeHtml)return'Enable "HTML output" — HTML is required for every generation.';if(!e.framework)return"Select a framework.";if(!e.language)return"Select a language.";if(!e.projectType)return"Select a project type.";if(void 0===e.a11y||null===e.a11y)return"Select an accessibility level.";if(!e.styling?.length)return"Select a styling option.";if(e.styling.includes("Auto"))return"Choose a specific styling option (Auto is not allowed).";if(a(e.category,e.projectType)){if(!e.backendFramework)return"Select a backend framework.";if(!e.database||"None"===e.database)return"Select a database (or adjust project type if no database is needed).";if(!e.dataStoreKind)return"Select SQL or NoSQL to match your database choice.";if(!e.apiStyle)return"Select REST or GraphQL for the API.";if("SQL"===e.dataStoreKind&&!i.includes(e.database))return"For SQL storage, choose PostgreSQL, MySQL, or SQLite.";if("NoSQL"===e.dataStoreKind&&!r.includes(e.database))return"For NoSQL storage, choose MongoDB."}return null}},97821:(e,t,n)=>{n.d(t,{nS:()=>o,oG:()=>a});var i=n(20293);let r={Planning:i.Fi,Reasoning:i.Fi,"UI generation":i.Fi,"Code generation":i.Fi,"Backend generation":i.Fi,Debugging:i.Fi,Refactoring:i.Fi,Testing:i.os,Documentation:i.os,Optimization:i.Fi};function a(e,t){let n=t.taskModels?.[e];return n?.trim()?n.trim():!1!==t.useRecommendedTaskModels?function(e,t){let n=r[e];return"fast"===t&&("Testing"===e||"Documentation"===e)||"fast"===t&&"Testing"!==e&&"Documentation"!==e?i.os:n}(e,t.mode):"fast"===t.mode?i.os:i.Fi}function o(e){return{planning:a("Planning",e),reasoning:a("Reasoning",e),uiGeneration:a("UI generation",e),codeGeneration:a("Code generation",e),backendGeneration:a("Backend generation",e),compliance:a("Testing",e),refinement:a("Refactoring",e)}}},2021:(e,t,n)=>{n.d(t,{u:()=>s});var i=n(11185),r=n.n(i);let a=process.env.MONGODB_URI,o=global.mongooseCache??{conn:null,promise:null};async function s(){if(!a)throw Error("MONGODB_URI not set in .env.local");if(o.conn)return o.conn;o.promise||(o.promise=r().connect(a,{bufferCommands:!1,maxPoolSize:10,serverSelectionTimeoutMS:5e3,socketTimeoutMS:45e3}));try{o.conn=await o.promise}catch(e){throw o.promise=null,e}return o.conn}global.mongooseCache=o},20293:(e,t,n)=>{n.d(t,{Fi:()=>i,Rm:()=>a,WP:()=>o,os:()=>r,uR:()=>s});let i="gpt-5.4",r="gpt-5.4-mini",a=32768,o=16384;function s(e){return/^o\d|gpt-5/i.test(e)}},99678:(e,t,n)=>{n.d(t,{Rm:()=>r.Rm,WP:()=>r.WP,fr:()=>a,os:()=>r.os,uR:()=>r.uR});var i=n(54214),r=n(20293);let a=new i.ZP({apiKey:process.env.OPENAI_API_KEY??"missing-key",maxRetries:1,timeout:24e4})},92223:(e,t,n)=>{n.d(t,{HS:()=>T,Q0:()=>b,Td:()=>E,_f:()=>I,_v:()=>y,ch:()=>w,sh:()=>v,wR:()=>S,wi:()=>f});var i=n(50650),r=n(29306);let a=`
OUTPUT FORMAT — follow exactly:
- Return raw code only. NEVER wrap output in markdown code fences (\`\`\`).
- NEVER add prose, headings, explanations, or commentary before or after code.
- Multi-file projects: emit every file using EXACTLY this marker format:
    // ===FILE: path/to/file===
    <file content here>
    // ===END FILE===
- Single-file projects: return just the raw file contents with no wrapper.
- When in doubt between single-file and multi-file, use multi-file for anything with more than one logical concern.
`.trim(),o=`
FULL PROJECT REQUIREMENTS:
- Always include: package.json (with all dependencies), README.md, .env.example.
- Use a proper directory structure (src/, components/, pages/ or app/, lib/, hooks/, types/, public/).
- Every component in its own file. No mega-files over 400 lines.
- Include a root index/layout file that ties everything together.
- All imports must be resolvable within the generated file set.
- tsconfig.json with strict mode enabled (when TypeScript is requested).
`.trim(),s=`
You are an elite senior product engineer generating production-grade frontend code.

ZERO-TOLERANCE POLICY:
- NO "TODO" comments. Implement every feature requested.
- NO "lorem ipsum" or placeholder text. Use context-aware real copy.
- NO empty components, sections, or styles. Everything must be functional.
- NO truncated code. If a file is large, emit it in its entirety.

ENGINEERING PRINCIPLES:
- Production-Grade: Write code a principal engineer would be proud to ship. Use clean architecture and robust patterns.
- Semantic & Accessible: Use landmarks, ARIA labels, and focus management (WCAG AA minimum).
- Performance: Optimize bundle size, use lazy loading where appropriate, and ensure 60fps animations.
- Error Resilience: Implement robust error boundaries, empty states, and loading skeletons.
- Mobile-First: All layouts must be responsive (320px to 1440px+).
- Clean Imports: Every import must be resolvable and used. No circular dependencies.
- Modular Design: Keep functions small (cyclomatic complexity < 10). Split large components into smaller, reusable pieces.

VISUAL & UX EXCELLENCE:
- Polished Design: Use consistent spacing, premium typography, and subtle micro-interactions.
- State Management: Use context or state libraries correctly. No "prop drilling" past 3 levels.

${a}
`.trim(),l=`
You are an elite senior engineer adding features and making improvements to an existing codebase.

PRINCIPLES:
- Study the uploaded codebase thoroughly before making any changes.
- Understand the existing architecture, patterns, naming conventions, and code style.
- Match the existing code style exactly — same indentation, same naming patterns, same import style.
- Make the smallest correct change set that fulfills the user's request.
- Do NOT refactor or rewrite code that the user did not ask to change.
- Do NOT remove any existing features or functionality.
- All new code must integrate seamlessly with the existing codebase.
- All new imports must be compatible with existing dependencies.
- If adding a new dependency is absolutely necessary, add it to package.json too.
- Return ONLY the files that were modified or created — not the entire project.

SELF-CHECK (perform silently before outputting):
1. Does every changed file still compile correctly with the existing codebase?
2. Are all new imports resolvable in the existing dependency tree?
3. Did I preserve all existing functionality?
4. Is the code style consistent with the existing files?
5. Are the changes complete — nothing is half-implemented?

${a}
`.trim(),c=`
You are an elite senior backend engineer generating production-ready server code.

ZERO-TOLERANCE POLICY:
- NO "TODO" or placeholder handlers. Every endpoint must be fully functional.
- NO hard-coded secrets or credentials. Use environment variables exclusively.
- NO swallowed exceptions. Every catch block must log and handle errors correctly.

ENGINEERING PRINCIPLES:
- Secure by Design: Implement input validation (Zod/Joi), CORS, rate limiting, and security headers (Helmet).
- Architecture: Use service-layer separation (Controller -> Service -> Model). Implement Dependency Injection where practical.
- Reliability: Include a /health endpoint, request logging (Morgan/Winston), and structured JSON error responses.
- Database Excellence: Use migrations (if applicable), proper indexing, and optimized queries.
- API Standards: Use correct HTTP status codes and RESTful/GraphQL best practices.
- Types: If using TypeScript, no "any". Use strict types and interfaces for all data.
- Modularization: Keep business logic separated from transport layers. Ensure cyclomatic complexity < 10.

${a}
`.trim(),d=`
You are an elite senior mobile engineer generating production-ready mobile application code.

ZERO-TOLERANCE POLICY:
- NO "TODO" comments. All navigation and screens must be fully implemented.
- NO placeholder widgets. Use real UI elements and context-aware copy.
- NO truncated files. Every file must be complete and syntactically correct.

ENGINEERING PRINCIPLES:
- Clean Architecture: Strictly separate Presentation (UI), Domain (Business Logic), and Data (API/Storage) layers.
- Native Performance: Optimize list rendering (FlatList/ListView), image caching, and avoid unnecessary re-renders.
- Robust Navigation: Use deep-linking ready navigation (Expo Router / GoRouter).
- Error Handling: Global error handlers, offline support hints, and retry mechanisms.
- State Management: Use Provider, Riverpod, or Bloc correctly. No monolithic state objects.

FRAMEWORK SPECIFICS:
- React Native (Expo): Use Expo SDK 50+ patterns, functional components with hooks, and Expo Router. Use NativeWind or React Native Paper if specified.
- Flutter: Use latest stable Dart, null-safe code, const widgets, and Material 3 / Cupertino theming.

${a}
`.trim();function u(e){let t=(e??[]).filter(e=>e.name?.trim());return t.length?["USER-REQUESTED NPM LIBRARIES (exclusive):",...t.map(e=>`- ${e.name.trim()}: ${(e.purpose||"").trim()}`),"","- Include these in package.json only when needed for the implementation.","- Do NOT add any other npm packages, CDNs, or dependencies beyond the stack minimum plus the list above."].join("\n"):"ADDITIONAL NPM DEPENDENCIES:\n- Do not add packages beyond what the selected framework/stack minimally requires.\n- Do not add optional UI kits, analytics, or helpers unless indispensable for the stack itself."}function p(e){let t=e.styling[0]??"Custom CSS";return["STRICT TECHNOLOGY SCOPE (non-negotiable):","- Implement ONLY what appears in STACK CONFIGURATION. Do not add extra npm packages, CSS frameworks, ORMs, databases, or APIs unless they are strictly required by the selected framework and unavoidable.","- Do not substitute technologies (for example: no Vue in a React project, no extra ORMs or databases beyond the selected stack).","Custom CSS"===t?"- Styling: Use plain CSS files or <style> only. Do NOT use Tailwind, Bootstrap, or other utility/CSS frameworks.":"Tailwind CSS"===t?"- Styling: Tailwind CSS utilities only for styling. Do NOT add Bootstrap, Bulma, or parallel global CSS frameworks.":"Bootstrap"===t?"- Styling: Bootstrap only. Do NOT add Tailwind or other CSS frameworks.":"Three.js"===t?"- Styling: Use three.js for 3D/WebGL where needed; use plain minimal CSS for chrome/layout. Do not add Babylon.js, A-Frame, or other 3D runtimes.":"Shadcn/ui"===t?"- Styling: Shadcn/ui + Tailwind as required by shadcn. Do not add Bootstrap or parallel component libraries.":`- Styling: Follow "${t}" exclusively for presentation.`,e.includeHtml?"- HTML: Deliver real semantic HTML (or JSX/SFC output that renders semantic HTML). No canvas-only UIs unless Three.js is selected for 3D.":"- HTML: (configuration should have required HTML — still output semantic structure.)",(0,r.f)(e.category,e.projectType)&&"GraphQL"===e.apiStyle?"- APIs: GraphQL only — no parallel REST surface unless explicitly required for health checks.":(0,r.f)(e.category,e.projectType)&&"REST"===e.apiStyle?"- APIs: REST/HTTP JSON only — no GraphQL schema or resolvers.":"",(0,r.f)(e.category,e.projectType)&&"SQL"===e.dataStoreKind?"- Database: SQL only — use the selected SQL database; do not add MongoDB or other NoSQL stores.":(0,r.f)(e.category,e.projectType)&&"NoSQL"===e.dataStoreKind?"- Database: NoSQL only — use the selected store; do not add PostgreSQL/MySQL/SQLite.":""].filter(Boolean).join("\n")}function m(e){let t=[`Category:          ${e.category??"Frontend"}`,`Framework:         ${e.framework}`,`Language:          ${e.language}`,`Styling:           ${e.styling.join(", ")}`,`Project type:      ${e.projectType}`,`Accessibility:     ${e.a11y}`,`Generation mode:   ${e.mode}`,`HTML required:     ${e.includeHtml?"yes":"no"}`],n="Full Stack"===e.projectType||"Full Project"===e.projectType||"Full Stack"===e.category;if("HTML+CSS"===e.framework&&e.styling.includes("Custom CSS")&&!n?t.push("Project shape:     Simple static HTML + CSS only — no bundler unless project type is Full Project."):n?t.push("Project shape:     Create a root folder with frontend/ and backend/ subdirectories, plus README.md and .env.example.",o):"Full Page"===e.projectType?t.push("Project shape:     Single page with complete layout — header, main content, footer, all sections."):t.push("Project shape:     Self-contained component or minimal multi-file module."),("React.js"===e.framework||"Next.js"===e.framework||"Remix"===e.framework||"Vite + React"===e.framework||"Vite + React + Node.js"===e.framework)&&t.push("Component style:   Functional components with hooks only. No class components."),"Next.js"===e.framework){let n="Full Stack"===e.projectType||"Full Stack"===e.category;t.push(n?"Next.js scope:     App Router full-stack — use Route Handlers / server actions matching the selected API style and database; no extra backend stack unless STACK lists it.":"Next.js scope:     App Router frontend only — pages/ UI; no separate backend services unless project type is Full Stack.")}return"Vite + React"===e.framework&&t.push("Vite scope:        Vite + React SPA only — no Node backend unless you switch project/framework to full-stack."),"Vite + React + Node.js"===e.framework&&t.push("Vite + Node scope: Vite dev server for frontend/ + Node.js backend/ — wire with selected REST or GraphQL only."),e.styling.includes("Tailwind CSS")&&t.push("Tailwind:          Utility classes for styling layers where Tailwind is selected."),e.styling.includes("Shadcn/ui")&&t.push("Shadcn/ui:         Import from @/components/ui/*. Do not redefine shadcn primitives inline."),"Flutter"===e.framework&&t.push("Flutter:           Use null-safe Dart, const widgets where possible, Material 3 / Cupertino theming, and scalable lib/ or feature-first folders."),(0,r.f)(e.category,e.projectType)&&t.push(`Backend framework: ${e.backendFramework}`,`Data store:        ${e.dataStoreKind}`,`Database:          ${e.database}`,`API style:         ${e.apiStyle}`),t.join("\n")}function g(e){return`Backend framework: ${e.backendFramework}
Language:          ${e.language}
Database:          ${e.database}
Auth required:     ${e.includeAuth?"yes — include JWT-based auth middleware and route guards":"no"}
Tests required:    ${e.includeTests?"yes — include unit tests with a popular test runner for the chosen framework":"no"}
Endpoints:         ${(e.endpoints??[]).length?(e.endpoints??[]).join(", "):"derive sensible RESTful CRUD endpoints from the description"}`}function h(e){return e.map((e,t)=>{let n=(0,i.kd)(e.path)?(0,i.i)(e.content,8e3):"[binary or unsupported file omitted]";return`--- File ${t+1}: ${e.path} ---
${n}`}).join("\n\n")}function f(e,t){if("Project Audit"===e.category)return function(e,t){let n="React Native Application"===e.category||"Flutter Application"===e.category||"React Native"===e.framework||"Expo"===e.framework||"Flutter"===e.framework;return`
${n?d:s}

--- AUDIT MODE ---
You are performing a deep project audit. Your job is to:
1. Read ALL provided files carefully before drawing conclusions.
2. Identify bugs, runtime errors, compile errors, logic issues, security holes, and accessibility gaps.
3. Prioritise findings by severity: CRITICAL > HIGH > MEDIUM > LOW.
4. For each finding: state the file, line (if determinable), root cause, and exact fix.
5. After the report, emit ONLY the corrected files — do not rewrite files that have no issues.
6. Never invent files that are not present unless a missing file is essential for the fix.

--- STACK CONFIGURATION ---
${m(e)}

--- STRICT STACK RULES ---
${p(e)}

--- DEPENDENCY POLICY ---
${u(t)}
`.trim()}(e,t);let n="React Native Application"===e.category||"Flutter Application"===e.category||"React Native"===e.framework||"Expo"===e.framework||"Flutter"===e.framework;return`${n?d:s}

--- STACK CONFIGURATION ---
${m(e)}

--- STRICT STACK RULES ---
${p(e)}

--- DEPENDENCY POLICY ---
${u(t)}`}function y(e,t){let n="React Native Application"===e.category||"Flutter Application"===e.category||"React Native"===e.framework||"Expo"===e.framework||"Flutter"===e.framework;return`${n?d:l}

--- STACK CONFIGURATION ---
${m(e)}

--- STRICT STACK RULES ---
${p(e)}

--- DEPENDENCY POLICY ---
${u(t)}`}function S(e,t,n,i=[]){if("Project Audit"===n.category&&i.length>0)return function(e,t,n){let i=t.slice(0,60),r=i.length?h(i):"(no files were extracted from the upload)";return["The user uploaded a project for a thorough audit and bug-fix pass.","","=== USER REQUEST ===",e?.trim()||"Trace all bugs, explain their root causes, and produce corrected code for every affected file.","",`Total files extracted: ${t.length} | Files in context: ${i.length}`,"","=== STACK CONFIGURATION ===",m(n),"","=== PROJECT FILES ===",r,"","=== REQUIRED RESPONSE FORMAT ===","<<<REPORT>>>","Write a structured bug report with these severity sections:","  CRITICAL: Crashes, data loss, broken builds","  HIGH:     Broken core features, missing route handlers, invalid types","  MEDIUM:   Logic errors, performance issues, accessibility gaps","  LOW:      Code style, minor improvements, dead code","Format each finding as: [File] [Line if known] — Root cause → Fix","<<<CODE>>>","Emit only the corrected files using the required // ===FILE: path=== markers.","If no files need changes, write a short note inside the code section."].join("\n")}(e,i,n);let r="React Native Application"===n.category||"Flutter Application"===n.category||"React Native"===n.framework||"Expo"===n.framework||"Flutter"===n.framework,a="Full Stack"===n.projectType||"Full Project"===n.projectType||"Full Stack"===n.category;return[r?"GENERATE MOBILE APPLICATION:":"GENERATE FRONTEND EXPERIENCE:",t?"A reference screenshot is attached. Recreate the visible UI with high fidelity — match layout, spacing, typography, and colour palette. Polish and improve rough edges while preserving the overall intent.":"No screenshot attached. Generate purely from the textual description.","","=== USER REQUEST ===",e?.trim()||"(no description provided — generate a sensible, complete, impressive example)","","=== IMPLEMENTATION CONSTRAINTS ===",m(n),"",a?"=== FULL PROJECT REQUIREMENTS ===\nGenerate a complete, runnable project with:\n- All source files (components, pages, layouts, hooks, types, utils)\n- package.json with all required dependencies pinned to stable versions\n- tsconfig.json with strict settings\n- README.md with setup instructions\n- .env.example with all required environment variables\n- No placeholder files — every file must be fully implemented\n":"","=== MANDATORY PRE-OUTPUT CHECKLIST ===","Before emitting your answer, silently confirm:","1. Output format matches project type (single-file vs multi-file with correct markers).","2. All imports are correct and resolvable.","3. No JSX/HTML syntax errors — all tags opened and closed.","4. Responsive behaviour is implemented at mobile and desktop breakpoints.","5. Accessibility attributes are present on all interactive and image elements.","6. Output is complete — nothing is truncated, stubbed, or left as a placeholder.","","Output the final code now."].filter(Boolean).join("\n")}function w(e,t,n){let i=t.slice(0,60),r=i.length?h(i):"(no project files were provided)";return["The user has provided an existing codebase and wants features added or improved.","Study the code carefully before making any changes. Match existing patterns and style.","","=== FEATURE REQUEST ===",e?.trim()||"Review the codebase and suggest + implement the most impactful improvements.","",`Total files extracted: ${t.length} | Files in context: ${i.length}`,"","=== STACK CONFIGURATION ===",m(n),"","=== EXISTING CODEBASE ===",r,"","=== INSTRUCTIONS ===","1. Implement the requested feature(s) by modifying only the files that need to change.","2. Return ONLY the modified and newly created files — not unchanged files.","3. Preserve all existing functionality and code style.","4. Ensure all new code integrates cleanly with the existing architecture.","5. If a new package is needed, update package.json too.","","=== MANDATORY PRE-OUTPUT CHECKLIST ===","1. Did I understand the existing architecture before making changes?","2. Are all changed files syntactically valid and import-complete?","3. Did I preserve all existing features?","4. Is my implementation complete — no half-done sections?","","Output only the changed/new files now."].join("\n")}function b(e,t,n,i){let r=t.slice(0,60),a=r.length?h(r):"(no project files were provided)";return["The user has uploaded BOTH a screenshot reference AND an existing codebase.","Your job is to implement what is shown in the screenshot into the existing codebase.","","=== USER REQUEST ===",e?.trim()||"Implement the design shown in the screenshot into the existing codebase. Match the layout, components, and visual style precisely.","",`Total files extracted: ${t.length} | Files in context: ${r.length}`,"","=== STACK CONFIGURATION ===",m(i),"","=== EXISTING CODEBASE ===",a,"","=== INSTRUCTIONS ===","1. Study the screenshot carefully — identify all UI elements, layout, colors, typography.","2. Study the existing codebase — understand the architecture, patterns, and style.","3. Implement the design from the screenshot into the existing codebase.","4. Match the existing code style exactly.","5. Return only the files that need to be created or modified.","6. Ensure all changes integrate cleanly with the existing architecture.","","=== MANDATORY PRE-OUTPUT CHECKLIST ===","1. Does the implementation faithfully represent what is shown in the screenshot?","2. Does it integrate cleanly with the existing codebase?","3. Are all imports correct?","4. Is the implementation complete?","","Output only the changed/new files now."].join("\n")}function E(e){return`
${s}

--- REFINEMENT MODE ---
You are making a targeted, surgical change to existing code.
Rules:
- Apply ONLY what the user asks for. Do not refactor unrelated sections.
- Preserve all existing functionality, structure, and style choices.
- Do not add features that were not requested.
- Do not remove working code unless explicitly asked.
- The output must be the COMPLETE updated file(s) — not a diff or a snippet.

--- STACK CONFIGURATION ---
${m(e)}
`.trim()}function T(e,t,n){return["Apply the following refinement to the code below.","Make the smallest safe change that fully satisfies the request.","Return the COMPLETE updated code — not a snippet or a diff.","","=== REFINEMENT REQUEST ===",e.trim(),"","=== CURRENT CODE ===",t,"","=== STACK CONFIGURATION ===",m(n),"","Output the complete revised code now."].join("\n")}function v(e){return`${c}

--- STACK CONFIGURATION ---
${g({backendFramework:e.backendFramework,database:e.database,language:e.language,includeAuth:e.includeAuth,includeTests:e.includeTests,endpoints:e.endpoints??[]})}

--- DEPENDENCY POLICY ---
${u(e.extraLibraries)}`}function I(e){return["Build a complete, production-ready backend from this requirement.","","=== DESCRIPTION ===",e.description.trim(),"","=== STACK CONFIGURATION ===",g({backendFramework:e.backendFramework,database:e.database,language:e.language,includeAuth:e.includeAuth,includeTests:e.includeTests,endpoints:e.endpoints??[]}),"","=== FULL PROJECT REQUIREMENTS ===","Always include:","- package.json with all production and dev dependencies","- tsconfig.json (if TypeScript)","- .env.example with all required environment variables","- README.md with setup and run instructions","- Proper directory structure: src/routes/, src/middleware/, src/models/, src/services/, src/utils/","","=== MANDATORY PRE-OUTPUT CHECKLIST ===","1. All routes have complete handler implementations.","2. Validation, error handling, and security middleware are included.","3. Environment variable names are consistent across all files.","4. Auth and tests included ONLY if requested.","5. The project is complete — no stubs, no truncated files, no placeholder routes.","","Output production-ready code now."].join("\n")}},91369:(e,t,n)=>{n.d(t,{P:()=>a});var i=n(75571),r=n(81430);async function a(){let e=await (0,i.getServerSession)(r.L);return e?.user?.id??null}},50650:(e,t,n)=>{function i(e){if(!e)return"";let t=e.trim();for(let e=0;e<5;e++){let e=t.match(/^```[\w\-.\s]*\r?\n([\s\S]*?)\n?```\s*$/);if(e)t=e[1].trim();else break}if(t.includes("```")){let n=e.match(/```[\w\-.\s]*\r?\n([\s\S]*?)\n?```/);if(n){let e=n[1].trim();e.length>t.length&&(t=e)}}return t.trim()}function r(e){return e.trim().length?e.split("\n").length:0}n.d(t,{Ek:()=>r,KO:()=>o,Kw:()=>u,OW:()=>i,Y5:()=>s,i:()=>l,kd:()=>c});let a={ts:"typescript",tsx:"typescript",js:"javascript",jsx:"javascript",mjs:"javascript",cjs:"javascript",html:"html",htm:"html",css:"css",scss:"css",sass:"css",less:"css",json:"json",jsonc:"json",md:"markdown",mdx:"markdown",svg:"svg",png:"image",jpg:"image",jpeg:"image",gif:"image",webp:"image",env:"dotenv",yaml:"yaml",yml:"yaml",py:"python",rb:"ruby",go:"go",rs:"rust",java:"java",php:"php",kt:"kotlin",swift:"swift",dart:"dart",sh:"bash",bash:"bash",sql:"sql",prisma:"prisma",graphql:"graphql",xml:"xml",toml:"toml",ini:"ini"};function o(e){let t;let n=[],i=/\/\/ ={1,3}FILE:\s*(.+?)={1,3}\r?\n([\s\S]*?)\/\/ ={1,3}END FILE={0,3}/g;for(;null!==(t=i.exec(e));){let e=t[1].trim(),i=t[2].trim();if(!e)continue;let r=e.split(".").pop()?.toLowerCase()??"txt";n.push({path:e,content:i,language:a[r]??"text"})}if(0===n.length&&e.trim()){let t=e.trim(),i=t.split("\n")[0].toLowerCase(),r="html";i.startsWith("import ")||i.startsWith("const ")||i.startsWith("export ")?r="typescript":i.startsWith("<?php")?r="php":i.startsWith("#!")&&(r="bash"),n.push({path:"output.html",content:t,language:r})}return n}function s(e){let t=e.match(/<<<REPORT>>>\r?\n([\s\S]*?)\r?\n?<<<CODE>>>/),n=e.match(/<<<CODE>>>\r?\n?([\s\S]*)$/);return{report:t?.[1]?.trim()??"",code:n?.[1]?.trim()||e.trim()}}function l(e,t=12e3){let n=e.trim();return n.length<=t?n:`${n.slice(0,t)}

[truncated ${n.length-t} characters]`}function c(e){return/\.(tsx?|jsx?|mjs|cjs|json|mdx?|css|scss|sass|less|html?|xml|yml|yaml|env|txt|ini|toml|graphql|gql|sql|prisma|py|rb|go|java|kt|kts|cs|php|dart|rs|swift)$/i.test(e)}function d(e,t,n){let i=[],r=e.toLowerCase(),a=t.length>1,o="Full Project"===n.projectType||"Full Stack"===n.projectType||"Full Stack"===n.category||"Backend"===n.category,s=(e,t,n,r="info")=>{i.push({name:e,passed:t,message:n,severity:r})},l=/<header|<main|<section|<nav|<article|<footer|aria-|role=/,c=/@media|sm:|md:|lg:|xl:|grid|flex|clamp\(/,d=/aria-|alt=|tabindex|tabIndex|focus-visible|role=/,u=/todo|fixme|lorem ipsum|placeholder/,p=/function\s+\w+\s*\(.*?\)\s*{[\s\S]{500,}}|const\s+\w+\s*=\s*\(.*?\)\s*=>\s*{[\s\S]{500,}}/,m=!o||t.length>=3;return s("Non-empty output",e.trim().length>0,e.trim().length>0?"Code was generated.":"Generated output is empty.","error"),s("Structure markers",!o||a||!e.includes("// ===FILE:"),a?`${t.length} file(s) detected.`:"Single-file output detected.",o&&!a?"warning":"info"),s("Modularization",m,m?"Project is properly modularized.":"Consider splitting logic into more files.","warning"),s("Function Complexity",!p.test(e),p.test(e)?"Some functions are overly long; consider refactoring.":"Functions appear focused and modular.","warning"),s("Semantic structure",l.test(r),l.test(r)?"Semantic or accessible structure present.":"Add semantic regions and accessibility hooks.",l.test(r)?"info":"warning"),s("Responsive design",c.test(r),c.test(r)?"Responsive patterns detected.":"Responsive breakpoints or layout strategies are limited.",c.test(r)?"info":"warning"),s("Accessibility",d.test(r),d.test(r)?"Accessibility hooks are present.":"No strong accessibility signals detected.",d.test(r)?"info":"warning"),s("No placeholder language",!u.test(r),u.test(r)?"Placeholder content found in output.":"No placeholder text found.",u.test(r)?"error":"info"),s("Project completeness",!o||t.some(e=>/readme|package\.json|app\.|src\//i.test(e.path))||e.includes("package.json"),o?"Project structure appears complete.":"Single-file output is acceptable for this scope.","info"),i}function u(e,t,n){return{checks:d(e,t,n),score:function(e,t=[],n){let i=d(e,t,n??{framework:"HTML+CSS",styling:["Custom CSS"],language:"TypeScript",projectType:"Component",a11y:"WCAG AA",mode:"balanced",includeHtml:!0}),r=i.filter(e=>e.passed).length;return Math.max(0,Math.min(100,Math.round(55+6*r-4*i.filter(e=>!e.passed&&"warning"===e.severity).length-8*i.filter(e=>!e.passed&&"error"===e.severity).length)))}(e,t,n)}}},65252:(e,t,n)=>{n.d(t,{Z:()=>o});var i=n(11185),r=n.n(i);let a=new i.Schema({prompt:{type:String,required:!0,maxlength:5e3},code:{type:String,required:!1,default:""},files:[{path:{type:String,required:!0},content:{type:String,required:!0},language:{type:String,default:"html"}}],config:{category:{type:String},framework:{type:String,default:"HTML+CSS"},styling:[{type:String}],language:{type:String,default:"TypeScript"},projectType:{type:String,default:"Component"},a11y:{type:String,default:"WCAG AA"},mode:{type:String,default:"accurate"},backendFramework:{type:String},database:{type:String},includeAuth:{type:Boolean,default:!1},includeTests:{type:Boolean,default:!1}},lines:{type:Number,default:0},chars:{type:Number,default:0},qualityScore:{type:Number,default:0,min:0,max:100},qualityIssues:[{type:String}],imageUsed:{type:Boolean,default:!1},refinementCount:{type:Number,default:0}},{timestamps:!0,toJSON:{virtuals:!0},toObject:{virtuals:!0}});a.index({createdAt:-1}),a.index({"config.framework":1}),a.index({qualityScore:-1});let o=r().models.Generation||r().model("Generation",a)},71732:(e,t,n)=>{n.d(t,{Z:()=>o});var i=n(11185),r=n.n(i);let a=new i.Schema({email:{type:String,required:!0,unique:!0,lowercase:!0,trim:!0,index:!0},name:{type:String},image:{type:String},passwordHash:{type:String},emailVerified:{type:Date},githubId:{type:String,sparse:!0,unique:!0},githubLogin:{type:String},githubAvatar:{type:String},githubAccessToken:{type:String},googleId:{type:String,sparse:!0,unique:!0},resetPasswordToken:{type:String},resetPasswordExpires:{type:Date}},{timestamps:!0}),o=r().models.User??r().model("User",a)}};