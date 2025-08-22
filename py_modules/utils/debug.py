"""
Debug and logging utilities
"""
import os
import subprocess
import decky
from pathlib import Path
from typing import Dict


class DebugUtils:
    """Debugging and logging utilities"""
    
    async def get_log_content(self, lines: int = 100) -> str:
        """Get the last N lines of the log file"""
        try:
            log_file = os.path.join(decky.DECKY_PLUGIN_LOG_DIR, "achievement_tracker.log")
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    all_lines = f.readlines()
                    return ''.join(all_lines[-lines:])
            return "No log file found"
        except Exception as e:
            return f"Error reading log: {str(e)}"
    
    async def get_debug_info(self) -> Dict:
        """Get debugging information about current state"""
        try:
            debug_info = {
                "environment_app_id": os.environ.get('SteamAppId'),
                "overlay_file_exists": Path("/dev/shm/SteamOverlayAppId").exists(),
                "steam_processes": [],
                "cache_dir_exists": Path(decky.DECKY_PLUGIN_RUNTIME_DIR).exists(),
                "settings_dir_exists": Path(decky.DECKY_PLUGIN_SETTINGS_DIR).exists(),
                "detected_app_id": None
            }
            
            # Check for overlay file content
            overlay_file = Path("/dev/shm/SteamOverlayAppId")
            if overlay_file.exists():
                try:
                    with open(overlay_file, 'r') as f:
                        debug_info["overlay_content"] = f.read().strip()
                except:
                    debug_info["overlay_content"] = "Could not read"
            
            # Get Steam processes
            try:
                result = subprocess.run(
                    ['pgrep', '-f', 'steam'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.stdout:
                    debug_info["steam_processes"] = result.stdout.strip().split('\n')[:10]  # Limit to 10
            except:
                pass
            
            # Check for running game process
            try:
                result = subprocess.run(
                    ['pgrep', '-f', 'AppId='],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.stdout:
                    debug_info["game_process_found"] = True
                    pids = result.stdout.strip().split('\n')
                    if pids and pids[0]:
                        try:
                            cmdline_result = subprocess.run(
                                ['cat', f'/proc/{pids[0]}/cmdline'],
                                capture_output=True,
                                text=True,
                                timeout=2
                            )
                            if cmdline_result.stdout:
                                import re
                                match = re.search(r'AppId=(\d+)', cmdline_result.stdout)
                                if match:
                                    debug_info["detected_app_id"] = match.group(1)
                        except:
                            pass
            except:
                debug_info["game_process_found"] = False
            
            return debug_info
            
        except Exception as e:
            decky.logger.error(f"Failed to get debug info: {e}")
            return {"error": str(e)}
    
    def log_error(self, message: str, exception: Exception = None):
        """Log an error with optional exception details"""
        if exception:
            decky.logger.error(f"{message}: {str(exception)}")
            import traceback
            decky.logger.error(traceback.format_exc())
        else:
            decky.logger.error(message)
    
    def log_performance(self, operation: str, start_time: float):
        """Log performance metrics"""
        import time
        elapsed = time.time() - start_time
        decky.logger.info(f"Performance: {operation} took {elapsed:.2f} seconds")
    
    async def check_api_connectivity(self, api) -> Dict:
        """Check if Steam API is accessible"""
        try:
            if not api:
                return {"connected": False, "error": "API not initialized"}
            
            # Try a simple API call
            test_result = await api.get_app_details(440)  # TF2 as test
            if test_result and "name" in test_result:
                return {"connected": True, "test_app": test_result["name"]}
            else:
                return {"connected": False, "error": "API call failed"}
                
        except Exception as e:
            return {"connected": False, "error": str(e)}