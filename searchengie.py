import requests
from bs4 import BeautifulSoup
from whoosh.index import create_in
from whoosh.fields import Schema, TEXT
from whoosh.qparser import QueryParser
import os

# Step 1: Crawl the website
def crawl(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    text = soup.get_text()
    return text

# Step 2: Create an index
schema = Schema(title=TEXT(stored=True), content=TEXT)

if not os.path.exists("indexdir"):
    os.mkdir("indexdir")

ix = create_in("indexdir", schema)

# Step 3: Add crawled content to the index
def add_to_index(title, content):
    writer = ix.writer()
    writer.add_document(title=title, content=content)
    writer.commit()

# Step 4: Search the index
def search_index(query):
    with ix.searcher() as searcher:
        query = QueryParser("content", ix.schema).parse(query)
        results = searcher.search(query)
        for r in results:
            print("Found in:", r['title'])

# Main Program
if __name__ == "__main__":
    url = input("Enter URL to crawl: ")
    text = crawl(url)
    title = url  # Use URL as the title for simplicity
    add_to_index(title, text)
    
    search_term = input("Enter search term: ")
    search_index(search_term)
