#!/usr/bin/env python3
"""
OmniRole AI — Official Terminal CLI Client
Interactive terminal client & one-shot CLI for chatting with autonomous AI personas.
"""

import sys
import os
import json
import urllib.request
import urllib.error
import argparse
from typing import Optional, Dict, Any, List

# Configuration Defaults
DEFAULT_API_URL = os.environ.get("OMNI_API_URL", "http://54.196.14.199")
DEFAULT_API_KEY = os.environ.get("OMNI_API_KEY", "omni_live_f066a5bad5c014bec162545e8a6ce498")
DEFAULT_ROLE = os.environ.get("OMNI_ROLE", "code-architect")

# ANSI Color Codes for human-crafted terminal aesthetic
CYAN = "\033[96m"
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
PURPLE = "\033[95m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def print_banner():
    banner = f"""{CYAN}{BOLD}
   ___                  _ ____       _         _    ___ 
  / _ \\ _ __ ___  _ __ (_)  _ \\ ___ | | ___   / \\  |_ _|
 | | | | '_ ` _ \\| '_ \\| | |_) / _ \\| |/ _ \\ / _ \\  | | 
 | |_| | | | | | | | | | |  _ < (_) | |  __// ___ \\ | | 
  \\___/|_| |_| |_|_| |_|_|_| \\_\\___/|_|\\___/_/   \\_\\___|
{RESET}{DIM}  Autonomous AI Persona Studio • Real-Time Web Grounding • Vector Memory{RESET}
"""
    print(banner)


def fetch_roles(api_url: str) -> List[Dict[str, Any]]:
    """Fetch all active AI roles from the server."""
    url = f"{api_url.rstrip('/')}/api/v1/roles"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "OmniCLI/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data if isinstance(data, list) else data.get("roles", [])
    except Exception as e:
        return []


def send_chat(
    api_url: str,
    api_key: str,
    role_slug: str,
    message: str,
    conversation_id: Optional[str] = None,
    image_url: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """Send chat message to public developer API endpoint."""
    url = f"{api_url.rstrip('/')}/v1/roles/{role_slug}/chat"
    payload = {
        "message": message,
        "conversation_id": conversation_id,
        "image_url": image_url,
        "history": history or [],
    }
    data_bytes = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={
            "Content-Type": "application/json",
            "X-API-Key": api_key,
            "User-Agent": "OmniCLI/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        try:
            err_json = json.loads(err_body)
            detail = err_json.get("detail", err_body)
        except Exception:
            detail = err_body
        raise RuntimeError(f"HTTP {e.code}: {detail}")
    except Exception as e:
        raise RuntimeError(f"Connection error: {e}")


def display_response(res: Dict[str, Any], show_sources: bool = True):
    """Format and print response cleanly in terminal."""
    response_text = res.get("response", "")
    role_name = res.get("role_name", "AI Assistant")
    model = res.get("model_used", "ai-engine")
    latency = res.get("latency_ms", 0)
    tokens = res.get("tokens_used", {}).get("total_tokens", 0)
    connectors = res.get("connector_outputs", [])

    print(f"\n{PURPLE}{BOLD}● {role_name}{RESET} {DIM}({model} • {latency:.0f}ms • {tokens} tokens){RESET}")
    print("-" * 65)
    print(f"{response_text.strip()}")
    print("-" * 65)

    if show_sources and connectors:
        for conn in connectors:
            c_name = conn.get("connector", "")
            sources = conn.get("sources", [])
            if c_name == "web_search" and sources:
                print(f"{CYAN}{BOLD}🌐 Live Web Citations:{RESET}")
                for s in sources[:4]:
                    domain = s.get("domain", "")
                    title = s.get("title", "Reference")
                    url = s.get("url", "")
                    print(f"  {GREEN}→{RESET} {BOLD}{title}{RESET} {DIM}({domain}){RESET}")
                    print(f"    {BLUE}{url}{RESET}")
    print()


def interactive_session(api_url: str, api_key: str, initial_role: str):
    """Interactive REPL mode in terminal."""
    print_banner()
    roles = fetch_roles(api_url)
    role_slugs = [r["slug"] for r in roles] if roles else ["code-architect", "data-analyst", "research-scientist"]

    current_role = initial_role if initial_role in role_slugs else (role_slugs[0] if role_slugs else "code-architect")
    conversation_id = None
    attached_image = None
    chat_history: List[Dict[str, str]] = []

    print(f"{GREEN}✓ Connected to {api_url}{RESET}")
    print(f"{GREEN}✓ Active Role:{RESET} {BOLD}{current_role}{RESET}")
    print(f"{DIM}Commands: /roles, /role <name>, /image <url>, /new, /exit{RESET}\n")

    while True:
        try:
            prompt_prefix = f"{CYAN}[{current_role}]{RESET}"
            if attached_image:
                prompt_prefix += f" {YELLOW}[🖼 image attached]{RESET}"
            prompt_prefix += f" {BOLD}❯{RESET} "

            user_input = input(prompt_prefix).strip()
            if not user_input:
                continue

            # Command Handlers
            if user_input in ["/exit", "/quit", ":q"]:
                print(f"\n{DIM}Goodbye!{RESET}")
                break

            if user_input == "/roles":
                print(f"\n{BOLD}Available Roles:{RESET}")
                for r in roles:
                    marker = f"{GREEN}➔{RESET}" if r["slug"] == current_role else " "
                    desc = r.get("description", "")[:60]
                    print(f"  {marker} {BOLD}{r['slug']:<24}{RESET} {DIM}{desc}{RESET}")
                print()
                continue

            if user_input.startswith("/role"):
                parts = user_input.split(maxsplit=1)
                if len(parts) > 1:
                    new_role = parts[1].strip()
                    if new_role in role_slugs:
                        current_role = new_role
                        conversation_id = None
                        chat_history = []
                        print(f"{GREEN}✓ Switched to {BOLD}{current_role}{RESET} (Fresh conversation)\n")
                    else:
                        print(f"{YELLOW}! Unknown role '{new_role}'. Run /roles to see list.{RESET}\n")
                else:
                    print(f"{YELLOW}Usage: /role <slug>{RESET}\n")
                continue

            if user_input.startswith("/image"):
                parts = user_input.split(maxsplit=1)
                if len(parts) > 1:
                    attached_image = parts[1].strip()
                    print(f"{GREEN}✓ Image attached: {attached_image}{RESET}\n")
                else:
                    attached_image = None
                    print(f"{DIM}Cleared attached image.{RESET}\n")
                continue

            if user_input in ["/new", "/clear", "/reset"]:
                conversation_id = None
                attached_image = None
                chat_history = []
                print(f"{GREEN}✓ Started fresh session.{RESET}\n")
                continue

            # Send prompt
            sys.stdout.write(f"{DIM}Thinking & searching web...{RESET}\r")
            sys.stdout.flush()

            res = send_chat(
                api_url=api_url,
                api_key=api_key,
                role_slug=current_role,
                message=user_input,
                conversation_id=conversation_id,
                image_url=attached_image,
                history=chat_history[-8:],
            )

            # Update session state
            conversation_id = res.get("conversation_id", conversation_id)
            attached_image = None  # Consume single-use attachment

            chat_history.append({"role": "user", "content": user_input})
            chat_history.append({"role": "assistant", "content": res.get("response", "")})

            # Clear 'thinking' line and print result
            sys.stdout.write("\r" + " " * 35 + "\r")
            display_response(res)

        except KeyboardInterrupt:
            print(f"\n\n{DIM}Session ended.{RESET}")
            break
        except Exception as e:
            sys.stdout.write("\r" + " " * 35 + "\r")
            print(f"{YELLOW}Error: {e}{RESET}\n")


def main():
    parser = argparse.ArgumentParser(
        description="OmniRole AI — Terminal Client",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  ./omni                                  # Launch interactive terminal chat
  ./omni "Explain how Redis cluster works" # Run one-shot query
  ./omni --role data-analyst "Analyze CAC to LTV ratio"
  ./omni --roles                          # List all active personas
""",
    )
    parser.add_argument("query", nargs="*", help="Optional one-shot query message")
    parser.add_argument("-r", "--role", default=DEFAULT_ROLE, help=f"Target role slug (default: {DEFAULT_ROLE})")
    parser.add_argument("-k", "--key", default=DEFAULT_API_KEY, help="OmniRole API Key")
    parser.add_argument("-u", "--url", default=DEFAULT_API_URL, help=f"API Base URL (default: {DEFAULT_API_URL})")
    parser.add_argument("--image", default=None, help="Image URL to pass along with query")
    parser.add_argument("--roles", action="store_true", help="List available AI roles")

    args = parser.parse_args()

    if args.roles:
        roles = fetch_roles(args.url)
        print(f"\n{BOLD}{CYAN}OmniRole AI Available Personas:{RESET}\n")
        for r in roles:
            print(f" • {BOLD}{r['slug']:<24}{RESET} {r.get('name', '')} {DIM}({r.get('model_name', '')}){RESET}")
            if r.get("description"):
                print(f"   {DIM}{r['description']}{RESET}")
        print()
        sys.exit(0)

    # If query provided, execute one-shot
    if args.query:
        full_query = " ".join(args.query)
        sys.stdout.write(f"{DIM}Connecting to {args.role}...{RESET}\r")
        sys.stdout.flush()
        try:
            res = send_chat(
                api_url=args.url,
                api_key=args.key,
                role_slug=args.role,
                message=full_query,
                image_url=args.image,
            )
            sys.stdout.write("\r" + " " * 35 + "\r")
            display_response(res)
        except Exception as e:
            sys.stdout.write("\r" + " " * 35 + "\r")
            print(f"{YELLOW}Error: {e}{RESET}")
            sys.exit(1)
    else:
        # Launch interactive REPL session
        interactive_session(api_url=args.url, api_key=args.key, initial_role=args.role)


if __name__ == "__main__":
    main()
