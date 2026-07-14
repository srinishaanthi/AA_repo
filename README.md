# Logistics App

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-qition2f)

## How to Run

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   - On Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
3. Run the backend server:
   ```bash
   python main.py
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd logistics
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

*Note: If you encounter an error running the frontend on Windows due to the `&` character in the project path (`'a' is not recognized`), consider renaming the root project folder to remove special characters (e.g., `a_and_a_Logistics`).*
