import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.main import app
from backend.inference import predict, load_inference_model
from backend.database import init_db

def run_all_tests():
    print("=" * 75)
    print("  SENTINEL-1 SAR OIL SPILL PLATFORM — COMPLETE VERIFICATION SUITE")
    print("=" * 75)

    sample_dir = root_dir / "sample_images"
    oil_sample = sample_dir / "oil_sample_1.jpg"
    clean_sample = sample_dir / "clean_sample_1.jpg"

    # 1. DB Init
    print("\n[1] Database Initialization & Seed Check...")
    db_ok = init_db()
    assert db_ok, "Database init failed"
    print("  --> PASS: Database connected and seeded.")

    # 2. PyTorch Model Load & Direct Inference
    print("\n[2] Direct AI Model Inference...")
    load_inference_model()
    oil_res = predict(oil_sample)
    assert oil_res["oil_detected"] is True
    print(f"  [+] Oil Sample:   Detected={oil_res['oil_detected']} Conf={oil_res['confidence']:.4f}")
    clean_res = predict(clean_sample)
    assert clean_res["oil_detected"] is False
    print(f"  [+] Clean Sample: Detected={clean_res['oil_detected']} Conf={clean_res['confidence']:.4f}")
    print("  --> PASS: PyTorch Model binary classification verified.")

    # 3. FastAPI Client Endpoints
    client = TestClient(app)

    print("\n[3] Testing API Endpoints...")

    # GET /
    r = client.get("/")
    assert r.status_code == 200, f"GET / failed: {r.status_code}"
    print(f"  [+] GET / -> {r.json().get('service')}")

    # GET /api/health
    r = client.get("/api/health")
    assert r.status_code == 200
    h_data = r.json()
    assert h_data["status"] == "online"
    assert h_data["service"] == "Oil Spill AI Backend"
    print(f"  [+] GET /api/health -> status={h_data['status']}, service={h_data['service']}")

    # GET /health
    r = client.get("/health")
    assert r.status_code == 200
    print(f"  [+] GET /health -> online={r.json().get('online')}")

    # GET /api/ais/live
    r = client.get("/api/ais/live")
    assert r.status_code == 200
    ais_live = r.json()
    assert ais_live["count"] > 0
    print(f"  [+] GET /api/ais/live -> source={ais_live['source']}, vessels={ais_live['count']}")

    # GET /api/ais/history
    r = client.get("/api/ais/history")
    assert r.status_code == 200
    print(f"  [+] GET /api/ais/history -> count={r.json()['count']}")

    # GET /api/ais/vessel/412345678
    r = client.get("/api/ais/vessel/412345678")
    assert r.status_code == 200
    v_info = r.json()["data"]["vessel"]
    assert v_info["mmsi"] == "412345678"
    print(f"  [+] GET /api/ais/vessel/412345678 -> {v_info['vessel_name']} ({v_info['vessel_type']})")

    # GET /api/satellite/latest
    r = client.get("/api/satellite/latest")
    assert r.status_code == 200
    sat_data = r.json()
    assert sat_data["count"] > 0
    print(f"  [+] GET /api/satellite/latest -> observations={sat_data['count']}")

    # GET /api/satellite/history
    r = client.get("/api/satellite/history")
    assert r.status_code == 200
    print(f"  [+] GET /api/satellite/history -> observations={r.json()['count']}")

    # GET /api/oil-spills
    r = client.get("/api/oil-spills")
    assert r.status_code == 200
    spills_data = r.json()
    assert spills_data["count"] > 0
    spill_id = spills_data["spills"][0]["spill_id"]
    print(f"  [+] GET /api/oil-spills -> count={spills_data['count']}, sample={spill_id}")

    # GET /api/oil-spills/{spill_id}
    r = client.get(f"/api/oil-spills/{spill_id}")
    assert r.status_code == 200
    spill_single = r.json()["spill"]
    assert spill_single["spill_id"] == spill_id
    assert "drift_predictions" in spill_single
    print(f"  [+] GET /api/oil-spills/{spill_id} -> Area={spill_single['estimated_area_km2']} km², Status={spill_single['status']}")

    # POST /api/oil-spills/detect
    with open(oil_sample, "rb") as f:
        r = client.post("/api/oil-spills/detect", files={"file": (oil_sample.name, f, "image/jpeg")})
    assert r.status_code == 200
    detect_res = r.json()["data"]
    assert detect_res["oil_detected"] is True
    print(f"  [+] POST /api/oil-spills/detect -> detected={detect_res['oil_detected']}, area={detect_res['estimated_area_km2']} km²")

    # POST /api/oil-spills/analyze
    r = client.post("/api/oil-spills/analyze", json={"spill_id": spill_id})
    assert r.status_code == 200
    analysis = r.json()
    assert analysis["spill_id"] == spill_id
    print(f"  [+] POST /api/oil-spills/analyze -> candidates={analysis['candidate_count']}")

    # GET /api/vessels/nearby
    r = client.get("/api/vessels/nearby?lat=9.985&lon=75.885&radius_km=60")
    assert r.status_code == 200
    nearby = r.json()
    print(f"  [+] GET /api/vessels/nearby -> nearby_vessels={nearby['count']}")

    # GET /api/vessels/ranking/{spill_id}
    r = client.get(f"/api/vessels/ranking/{spill_id}")
    assert r.status_code == 200
    ranking_data = r.json()
    assert "disclaimer" in ranking_data
    ranked = ranking_data["ranked_vessels"]
    if ranked:
        top = ranked[0]
        print(f"  [+] GET /api/vessels/ranking/{spill_id} -> Rank 1: {top['vessel_name']} (MMSI: {top['mmsi']}, Score: {top['overall_score']})")
    print(f"      Disclaimer present: '{ranking_data['disclaimer'][:65]}...'")

    # GET /api/dashboard/summary
    r = client.get("/api/dashboard/summary")
    assert r.status_code == 200
    dash = r.json()
    stats = dash["statistics"]
    print(f"  [+] GET /api/dashboard/summary -> Vessels={stats['total_vessels_tracked']}, Spills={stats['detected_oil_spills']}, Status={dash['system_status']['backend']}")

    # Legacy Endpoints Check
    with open(clean_sample, "rb") as f:
        r = client.post("/predict", files={"file": (clean_sample.name, f, "image/jpeg")})
    assert r.status_code == 200
    assert r.json()["is_oil_spill"] is False
    print("  [+] Legacy POST /predict works.")

    r = client.get("/stats")
    assert r.status_code == 200
    print("  [+] Legacy GET /stats works.")

    print("\n" + "=" * 75)
    print("  ALL 19 VERIFICATION TESTS PASSED SUCCESSFULLY! (100% PASS)")
    print("=" * 75)

if __name__ == "__main__":
    run_all_tests()
