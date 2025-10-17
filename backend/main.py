import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from langchain_community.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_community.llms import Ollama


os.environ["LANGCHAIN_TELEMETRY"] = "false"

BOT_NAME = "JinggStack AI Bot"
GOOGLE_API_KEY = "AIzaSyDTrw9DUhronwql13xFIVZRZPGWmJnoXZ0"
DATA_DIR = "./data"
PERSIST_DIR = "./chroma_db"
os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
ALLOWED_EXTENSIONS = {"txt"}


def load_docs(directory):
    loader = DirectoryLoader(directory, glob="**/*.txt")
    return loader.load()


def split_docs(documents, chunk_size=500, chunk_overlap=20):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap
    )
    return text_splitter.split_documents(documents)


print(f"[{BOT_NAME}] Loading documents...")
documents = load_docs(DATA_DIR)
docs = split_docs(documents)
print(f"[{BOT_NAME}] Loaded {len(documents)} docs, {len(docs)} chunks")

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
# embeddings = HuggingFaceEmbeddings(model_name="intfloat/e5-large-v2")

if os.path.exists(PERSIST_DIR):
    vectordb = Chroma(persist_directory=PERSIST_DIR, embedding_function=embeddings)
else:
    vectordb = Chroma.from_documents(
        docs, embedding=embeddings, persist_directory=PERSIST_DIR
    )


llm = Ollama(model="gemma3:1b")

# llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

prompt_template = f"""
You are {BOT_NAME}, an AI assistant for JinggStack.   
You provide answers ONLY based on the given context from company documents.  
Guide or assist the user using JinggStack resources and processes.  
Do not provide personal opinions or information.  
If the context does not contain the answer, respond exactly with:  
"I don't know based on the available documents."
Don't add Based On documents to your response.
Answer as you Have knowledge of JinggStack.
 
Context:
{{context}}
 
Question: {{question}}
Answer:
"""
PROMPT = PromptTemplate(
    template=prompt_template, input_variables=["context", "query"]
)

retrieval_chain = RetrievalQA.from_chain_type(
    llm,
    chain_type="stuff",
    retriever=vectordb.as_retriever(),
    chain_type_kwargs={"prompt": PROMPT},
)

app = Flask(__name__)
CORS(app)

CORS(app, origins=["http://localhost:5173"])

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    query = data.get("query")
    if not query:
        return jsonify({"error": "Query is required"}), 400
    answer = retrieval_chain.invoke({"query": query})
    return jsonify({"bot": BOT_NAME, "query": query, "answer": answer["result"]})


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/upload", methods=["POST"])
def uploaddocument():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Only .txt files are allowed"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(DATA_DIR, filename)
    file.save(filepath)

    from langchain.schema import Document

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()
        doc = Document(page_content=text, metadata={"source": filename})

        chunks = split_docs([doc])

        vectordb.add_documents(chunks)

    except Exception as e:
        return jsonify({"error": f"File uploaded but failed to embed: {str(e)}"}), 500

    return jsonify({"message": "File uploaded and embedded successfully"})

@app.route("/")
def home():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
