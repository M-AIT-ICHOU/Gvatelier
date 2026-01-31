from flask import Flask, render_template, send_from_directory, jsonify
from flask_cors import CORS
import os

# Copie de `app.py` pointant vers le nouveau dossier `flask_dashboard_v2`
app = Flask(__name__, static_folder='flask_dashboard_v2/static', template_folder='flask_dashboard_v2/templates')
CORS(app)

@app.route('/')
def index():
    return render_template('dashboard_v2.html')

def get_data_dir():
    static_dir = app.static_folder
    if not os.path.isabs(static_dir):
        return os.path.join(app.root_path, static_dir, 'data')
    else:
        return os.path.join(static_dir, 'data')

@app.route('/api/data-files')
def data_files():
    data_dir = get_data_dir()
    if not os.path.isdir(data_dir):
        return jsonify([])
    files = [f for f in os.listdir(data_dir) if os.path.isfile(os.path.join(data_dir, f))]
    files.sort()
    return jsonify(files)

@app.route('/static/data/<path:filename>')
def data(filename):
    data_dir = get_data_dir()
    return send_from_directory(data_dir, filename, conditional=True)

if __name__ == '__main__':
    # lancer sur le port 5001 pour éviter conflit avec l'app principale
    app.run(debug=True, port=5001)
