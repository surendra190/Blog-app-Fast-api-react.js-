import os
import json
from typing import Any, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

import redis

# Redis URL can be provided via REDIS_URL env var. Default to local redis.
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


def get_redis_client() -> redis.Redis:
    # decode_responses True so we get str back, not bytes
    return redis.Redis.from_url(REDIS_URL, decode_responses=True)


_redis = get_redis_client()


def get_cache(key: str) -> Optional[Any]:
    try:
        v = _redis.get(key)
        if v is None:
            return None
        return json.loads(v)
    except Exception:
        # swallow cache errors to avoid breaking API
        return None


def set_cache(key: str, value: Any, ex: Optional[int] = 60) -> None:
    try:
        _redis.set(key, json.dumps(value), ex=ex)
    except Exception:
        pass


def delete_cache(key: str) -> None:
    try:
        _redis.delete(key)
    except Exception:
        pass


def delete_pattern(pattern: str) -> None:
    try:
        # use scan_iter to avoid blocking Redis
        for k in _redis.scan_iter(match=pattern):
            _redis.delete(k)
    except Exception:
        pass
