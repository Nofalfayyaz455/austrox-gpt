from flask import Flask, request, render_template_string
import requests
from bs4 import BeautifulSoup
from whoosh.index import create_in
from whoosh.fields import Schema, TEXT
from whoosh.qparser import QueryParser
import os
import shutil

app = Flask(__name__)

# Whoosh schema
schema = Schema(title=TEXT(stored=True), content=TEXT)

# Prepare index
if os.path.exists("indexdir"):
    shutil.rmtree("indexdir")
os.mkdir("indexdir")
ix = create_in("indexdir", schema)

# Crawl function
def crawl(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    return soup.get_text()

# Index function
def add_to_index(title, content):
    writer = ix.writer()
    writer.add_document(title=title, content=content)
    writer.commit()

# Search function
def search_index(query):
    with ix.searcher() as searcher:
        parser = QueryParser("content", schema=ix.schema)
        myquery = parser.parse(query)
        results = searcher.search(myquery)
        return [r['title'] for r in results]

# HTML template
template = """
<!doctype html>
<title>Mini Search Engine</title>
<h1>Mini Search Engine</h1>
<form method="POST">
  <label>Webpage URL:</label><br>
  <input name="url" size="60"><br><br>
  <label>Search Term:</label><br>
  <input name="term" size="40"><br><br>
  <input type="submit">
</form>

{% if results %}
  <h2>Results:</h2>
  <ul>
    {% for result in results %}
      <li>{{ result }}</li>
    {% endfor %}
  </ul>
{% endif %}
"""

@app.route("/", methods=["GET", "POST"])
def home():
    results = []
    if request.method == "POST":
        url = request.form.get("url")
        term = request.form.get("term")
        try:
            content = crawl(url)
            add_to_index(url, content)
            results = search_index(term)
        except Exception as e:
            results = [f"Error: {str(e)}"]
    return render_template_string(template, results=results)

if __name__ == "__main__":
    app.run(debug=True)
