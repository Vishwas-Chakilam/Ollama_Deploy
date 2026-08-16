import json
import urllib.request
import urllib.error

def test_chat():
    url = "https://ollama-qwen.onrender.com/api/chat"
    payload = {
        "model": "qwen2.5:0.5b",
        "messages": [
            {
                "role": "user",
                "content": "Why is the sky blue? Answer in two sentences."
            }
        ],
        "stream": True  # Changed to True to stream responses
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    
    print("Sending request to Ollama on Render (this may take a moment if the service is sleeping)...")
    try:
        with urllib.request.urlopen(req) as response:
            print("\n--- Response ---")
            
            # Read the response line by line as it streams in
            for line in response:
                if line:
                    chunk = json.loads(line.decode("utf-8"))
                    if "message" in chunk and "content" in chunk["message"]:
                        # Print each token as it arrives without a newline
                        print(chunk["message"]["content"], end="", flush=True)
                    
                    if chunk.get("done"):
                        print("\n----------------")
                        print(f"Total duration: {chunk.get('total_duration', 0) / 1e9:.2f} seconds")
                        break
                        
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        print(e.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    test_chat()
