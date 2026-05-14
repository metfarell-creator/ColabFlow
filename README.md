# ColabFlow 🪐

**ColabFlow** is an AI-powered workspace designed for machine learning engineers and researchers to plan, orchestrate, and export production-ready Google Colab and Jupyter Notebook projects.

It bridges the gap between chaotic experimentation and organized ML project management by providing a centralized dashboard for dependencies, data sources, model architectures, and task tracking.

## 🚀 Key Features

- **Project Orchestration**: Manage multiple ML initiatives with distinct environments.
- **AI dependency Suggestion**: Get context-aware Python package recommendations via Gemini 1.5 Flash.
- **Model Registry**: Track frameworks (PyTorch, TensorFlow, etc.) and fine-tune hyperparameters.
- **Data Source Catalog**: Document your paths to GCS, BigQuery, and local datasets.
- **Deterministic Notebook Generation**: Automatically generates `.ipynb` and `.py` files with standard boilerplate (PIP installs, HF logins) and AI-generated model skeletons.
- **VS Code Integration**: Export `.code-workspace` files pre-configured with recommended extensions.
- **Git & Hugging Face Workflow**: Plan your remote repositories and model hub IDs.
- **Snapshots & History**: Save code versions as you iterate on your notebook templates.

## 🛡️ Security & P0 Architecture

- **Server-Side API Proxy**: The Gemini API key is stored strictly on the backend via Express. The client-side bundle never sees sensitive credentials.
- **Safe Storage Layer**: Robust `localStorage` handling with safe JSON parsing and versioning prevents app crashes.
- **Environment-first Auth**: Generated notebooks prefer `os.environ.get('HF_TOKEN')` for security, discouraging hardcoded tokens.

## 🛠️ Built With

- **Vite + React (TypeScript)**
- **Express (Node.js)**
- **Tailwind CSS + Motion**
- **Google Gemini API**
- **Lucide Icons**

## 🗺️ Roadmap

- [x] **v0.1**: Local-first MVP with Backend Proxy.
- [ ] **v0.2**: Real ZIP export of project structure.
- [ ] **v0.3**: Direct Hugging Face & GitHub API integrations.
- [ ] **v0.4**: Collaborative workspaces.

---

*Crafted for organized ML Research.*
