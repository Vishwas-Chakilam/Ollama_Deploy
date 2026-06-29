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
        "stream": False
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    
    print("Sending request to Ollama on Render (this may take a moment if the service is sleeping)...")
    try:
        with urllib.request.urlopen(req) as response:
            response_data = response.read().decode("utf-8")
            result = json.loads(response_data)
            
            print("\n--- Response ---")
            print(result.get("message", {}).get("content", "No content found."))
            print("----------------")
            print(f"Model used: {result.get('model')}")
            print(f"Total duration: {result.get('total_duration', 0) / 1e9:.2f} seconds")
            
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        print(e.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    test_chat()
