import json
import os
import shutil
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

CATALOG_FILE = 'catalog.json'
IMAGES_DIR = 'images'

# Verify the local directory layout boundaries are intact
if not os.path.exists(IMAGES_DIR):
    os.makedirs(IMAGES_DIR)

def load_data():
    if not os.path.exists(CATALOG_FILE):
        return []
    try:
        with open(CATALOG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        messagebox.showerror("Error", f"Could not read json: {e}")
        return []

def save_data(data):
    try:
        with open(CATALOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        messagebox.showerror("Error", f"Could not write json: {e}")
        return False

# --- Core GitHub Automation Engine ---
def sync_to_github(commit_message):
    try:
        # Check if the folder is initialized as a Git repository
        if not os.path.exists('.git'):
            print("Workspace is not a Git repo yet. Skipping auto-push step.")
            return False
            
        # Execute standard Git terminal chain variables sequentially
        subprocess.run(["git", "add", "."], check=True, capture_output=True, text=True)
        subprocess.run(["git", "commit", "-m", commit_message], check=True, capture_output=True, text=True)
        
        # Pull the current branch name safely (usually main or master)
        branch_res = subprocess.run(["git", "branch", "--show-current"], check=True, capture_output=True, text=True)
        current_branch = branch_res.stdout.strip() or "main"
        
        # Fire background push straight up to your GitHub origin host
        subprocess.run(["git", "push", "origin", current_branch], check=True, capture_output=True, text=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Git Sync Warning: {e.stderr}")
        return False
    except Exception as e:
        print(f"System Error running Git: {e}")
        return False

class StampDashboardApp:
    def __init__(self, root):
        self.root = root
        self.root.title("King of Stamps | Inventory Core")
        self.root.geometry("1100x650")
        
        self.stamps = load_data()
        self.selected_image_path = ""
        
        # --- Left Side Layout Form Fields ---
        form_frame = tk.Frame(root, padx=15, pady=15, width=320)
        form_frame.pack(side=tk.LEFT, fill=tk.Y)
        form_frame.pack_propagate(False)
        
        tk.Label(form_frame, text="ADD PRODUCT SOURCE", font=('Helvetica', 12, 'bold')).pack(anchor=tk.W, pady=5)
        
        fields = [
            ("ID (Unique SKU):", "id"),
            ("Type (individual/pack/random):", "type"),
            ("Stamp Name:", "name"),
            ("Scott Catalog #:", "scott"),
            ("Condition (Grade):", "condition"),
            ("Description Narrative:", "description"),
            ("Price ($):", "price")
        ]
        
        self.entries = {}
        for label_text, key in fields:
            tk.Label(form_frame, text=label_text, font=('Helvetica', 10)).pack(anchor=tk.W, pady=1)
            entry = tk.Entry(form_frame, font=('Helvetica', 10))
            entry.pack(fill=tk.X, pady=2)
            self.entries[key] = entry
            
        # --- Visual Image Selector Block ---
        tk.Label(form_frame, text="Product Stamp Image:", font=('Helvetica', 10)).pack(anchor=tk.W, pady=4)
        
        img_btn_frame = tk.Frame(form_frame)
        img_btn_frame.pack(fill=tk.X, pady=2)
        
        tk.Button(img_btn_frame, text="Choose Image...", command=self.select_image_file, font=('Helvetica', 9)).pack(side=tk.LEFT)
        self.img_label = tk.Label(img_btn_frame, text="No image selected", font=('Helvetica', 9, 'italic'), fg="#888")
        self.img_label.pack(side=tk.LEFT, padx=10)
        
        tk.Button(form_frame, text="APPEND STAMP RECORD", bg="#ff3366", fg="white", 
                  font=('Helvetica', 10, 'bold'), command=self.add_stamp, height=2).pack(fill=tk.X, pady=20)
        
        # --- Right Side Ledger View Table ---
        table_frame = tk.Frame(root, padx=15, pady=15)
        table_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        tk.Label(table_frame, text="ACTIVE SHOP VIRTUAL LEDGER", font=('Helvetica', 12, 'bold')).pack(anchor=tk.W, pady=5)
        
        columns = ("id", "type", "name", "scott", "price")
        self.tree = ttk.Treeview(table_frame, columns=columns, show='headings')
        
        self.tree.heading("id", text="ID / SKU")
        self.tree.heading("type", text="Category")
        self.tree.heading("name", text="Product Title")
        self.tree.heading("scott", text="Scott #")
        self.tree.heading("price", text="Price ($)")
        
        self.tree.column("id", width=80, anchor=tk.CENTER)
        self.tree.column("type", width=90, anchor=tk.CENTER)
        self.tree.column("name", width=250, anchor=tk.W)
        self.tree.column("scott", width=80, anchor=tk.CENTER)
        self.tree.column("price", width=80, anchor=tk.E)
        
        scrollbar = ttk.Scrollbar(table_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree.pack(fill=tk.BOTH, expand=True, pady=5)
        
        btn_tray = tk.Frame(table_frame)
        btn_tray.pack(fill=tk.X, pady=5)
        
        tk.Button(btn_tray, text="DELETE SELECTED STAMP", bg="#222222", fg="white",
                  font=('Helvetica', 10, 'bold'), command=self.delete_stamp, padding=6).pack(side=tk.RIGHT)
                  
        self.populate_tree()

    def select_image_file(self):
        file_path = filedialog.askopenfilename(
            title="Select Stamp Photo",
            filetypes=[("Image Files", "*.webp *.png *.jpg *.jpeg *.gif")]
        )
        if file_path:
            self.selected_image_path = file_path
            filename = os.path.basename(file_path)
            self.img_label.config(text=filename, fg="#ff3366", font=('Helvetica', 9, 'bold'))

    def add_stamp(self):
        stamp_id = self.entries["id"].get().strip()
        
        if not stamp_id or any(self.entries[k].get().strip() == "" for k in ["type", "name", "price"]):
            messagebox.showwarning("Validation Error", "ID, Type, Name, and Price are absolute field requirements!")
            return
            
        if not self.selected_image_path:
            messagebox.showwarning("Validation Error", "You must select a stamp photo asset file first!")
            return
            
        if any(s["id"] == stamp_id for s in self.stamps):
            messagebox.showerror("Conflict Error", f"Product SKU ID '{stamp_id}' already exists!")
            return

        try:
            price_float = float(self.entries["price"].get().strip())
        except ValueError:
            messagebox.showerror("Format Error", "Price must evaluate cleanly to a float number string!")
            return

        # Handle file copying mechanics locally
        _, ext = os.path.splitext(self.selected_image_path)
        dest_filename = f"{stamp_id}{ext}"
        dest_path = os.path.join(IMAGES_DIR, dest_filename)
        
        try:
            shutil.copy2(self.selected_image_path, dest_path)
        except Exception as e:
            messagebox.showerror("File Error", f"Could not move image into project tree: {e}")
            return

        new_stamp = {
            "id": stamp_id,
            "type": self.entries["type"].get().strip(),
            "name": self.entries["name"].get().strip(),
            "scott": self.entries["scott"].get().strip(),
            "condition": self.entries["condition"].get().strip(),
            "description": self.entries["description"].get().strip(),
            "price": price_float,
            "img": f"images/{dest_filename}"
        }

        self.stamps.append(new_stamp)
        if save_data(self.stamps):
            self.populate_tree()
            
            # Clear layout form fields
            for entry in self.entries.values():
                entry.delete(0, tk.END)
            self.selected_image_path = ""
            self.img_label.config(text="No image selected", fg="#888", font=('Helvetica', 9, 'italic'))
            
            # Execute background git push routine instantly
            pushed = sync_to_github(f"inventory: added stamp {stamp_id}")
            if pushed:
                messagebox.showinfo("Success", f"Stamp {stamp_id} appended locally and pushed live to GitHub Pages!")
            else:
                messagebox.showinfo("Saved Locally", f"Stamp {stamp_id} saved locally. Complete git setup to enable live auto-push.")

    def delete_stamp(self):
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a stamp record row from the list first!")
            return
            
        target_id = selected_item[0]
        if messagebox.askyesno("Confirm Delete", f"Permanently remove SKU: {target_id}?"):
            target_stamp = next((s for s in self.stamps if s["id"] == target_id), None)
            if target_stamp and os.path.exists(target_stamp["img"]):
                try:
                    os.remove(target_stamp["img"])
                except Exception as e:
                    print(f"Warning: Image file could not be deleted: {e}")

            self.stamps = [s for s in self.stamps if s["id"] != target_id]
            if save_data(self.stamps):
                self.populate_tree()
                
                # Sync deletions live up to GitHub Pages
                pushed = sync_to_github(f"inventory: removed stamp {target_id}")
                if pushed:
                    messagebox.showinfo("Success", f"Stamp {target_id} removed locally and pushed live to GitHub Pages!")