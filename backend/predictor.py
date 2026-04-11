import sys
import json
import os

try:
    import joblib
    import pandas as pd
except ImportError as e:
    print(json.dumps({"error": f"Missing library: {str(e)}"}))
    sys.exit(1)


def get_mock_prediction(key, features=None):
    if features is None:
        features = {}

    nova = float(features.get('nova_group', 1) or 1)
    nutri = float(features.get('nutriscore_num', 0) or 0)
    e_nums = float(features.get('nb_e_numbers', 0) or 0)

    if key == 'bioscore':
        return int(max(0, min(100, 100 - (nova * 10) - (e_nums * 5) - (nutri * 0.5))))

    if key == 'cardio_risk':
        risk_score = nutri + (nova * 2) + (e_nums * 1.5)
        if risk_score >= 12: return 'High'
        if risk_score >= 6: return 'Medium'
        return 'Low'

    if key == 'cardio_risk_percent':
        risk_score = nutri + (nova * 2) + (e_nums * 1.5)
        return min(98, max(10, int(risk_score * 4.2 + 10)))

    if key == 'diabetes_risk':
        sugar_indicator = nutri * 0.7 + (nova * 2.5)
        if sugar_indicator >= 15: return 'High'
        if sugar_indicator >= 8: return 'Medium'
        return 'Low'

    if key == 'diabetes_risk_percent':
        sugar_indicator = nutri * 0.7 + (nova * 2.5)
        return min(99, max(8, int(sugar_indicator * 4.5 + 12)))

    if key == 'additive_exposure':
        if e_nums >= 4: return 'High'
        if e_nums >= 2: return 'Medium'
        return 'Low'

    if key == 'ultra_transforme':
        return 1 if nova >= 4 else 0

    if key == 'additifs_suspects':
        return int(min(e_nums, 5))

    return 'Unknown'


def label_from_proba(proba):
    """Convertit une probabilité (0-1) en label Low / Medium / High."""
    if proba < 0.33:
        return 'Low'
    elif proba < 0.66:
        return 'Medium'
    else:
        return 'High'


def predict_with_proba(model, df, key):
    """
    Retourne (label, percent).
    - Utilise predict_proba() si disponible (classifieurs).
    - Retombe sur predict() pour les régresseurs (bioscore, etc.).
    """
    if hasattr(model, 'predict_proba'):
        try:
            proba_arr = model.predict_proba(df)[0]
            if len(proba_arr) == 2:
                high_proba = float(proba_arr[1])
            else:
                best_idx = int(proba_arr.argmax())
                high_proba = float(proba_arr[best_idx])

            percent = round(high_proba * 100)
            label = label_from_proba(high_proba)
            return label, percent
        except Exception:
            pass

    # Fallback : predict() classique
    pred = model.predict(df)[0]
    if hasattr(pred, 'item'):
        pred = pred.item()

    if isinstance(pred, str):
        label = pred
        percent_map = {'low': 20, 'medium': 50, 'high': 80,
                       'faible': 20, 'moyen': 50, 'élevé': 80}
        percent = percent_map.get(pred.lower(), 50)
        return label, percent

    val = float(pred)
    if 0.0 <= val <= 1.0:
        percent = round(val * 100)
        label = label_from_proba(val)
    else:
        percent = min(100, max(0, round(val)))
        label = label_from_proba(val / 100)
    return label, percent


def main():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input provided"}))
            return

        data = json.loads(input_data)

        features = {
            'nb_ingredients':             float(data.get('nb_ingredients', 0) or 0),
            'contains_preservatives':     float(data.get('contains_preservatives', 0) or 0),
            'contains_artificial_colors': float(data.get('contains_artificial_colors', 0) or 0),
            'contains_flavouring':        float(data.get('contains_flavouring', 0) or 0),
            'nova_group':                 float(data.get('nova_group', 1) or 1),
            'nutriscore_num':             float(data.get('nutriscore_num', 0) or 0),
            'nb_e_numbers':               float(data.get('nb_e_numbers', 0) or 0),
            'ingredients_length':         float(data.get('ingredients_length', 0) or 0),
            'ingredients_text':           str(data.get('ingredients_text', ''))
        }

        df = pd.DataFrame([features])

        # Chemin vers les modèles
        models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'models')

        # ── Modèles simples (label ou score brut) ──────────────────────────
        simple_model_files = {
            'bioscore':          'bioscore_model.joblib',
            'additive_exposure': 'additive_exposure_model.joblib',
            'ultra_transforme':  'ultra_transforme_model.joblib',
            'additifs_suspects': 'additifs_suspects_model.joblib'
        }

        # ── Modèles avec predict_proba (cardio & diabète) ──────────────────
        proba_model_files = {
            'cardio_risk':   'cardio_risk_model.joblib',
            'diabetes_risk': 'diabetes_risk_model.joblib'
        }

        predictions = {}

        # ── Prédictions simples ────────────────────────────────────────────
        for key, filename in simple_model_files.items():
            filepath = os.path.join(models_dir, filename)
            if os.path.exists(filepath):
                try:
                    model = joblib.load(filepath)
                    pred = model.predict(df)[0]
                    if hasattr(pred, 'item'):
                        pred = pred.item()
                    predictions[key] = pred
                except Exception as e:
                    sys.stderr.write(f"Exception for {filename}: {str(e)}\n")
                    predictions[key] = get_mock_prediction(key, features)
            else:
                predictions[key] = get_mock_prediction(key, features)

        # ── Prédictions avec probabilités (cardio & diabète) ──────────────
        for key, filename in proba_model_files.items():
            filepath = os.path.join(models_dir, filename)
            if os.path.exists(filepath):
                try:
                    model = joblib.load(filepath)
                    label, percent = predict_with_proba(model, df, key)
                    predictions[key]                = label
                    predictions[key + '_percent']   = percent
                except Exception as e:
                    sys.stderr.write(f"Exception for {filename}: {str(e)}\n")
                    predictions[key]              = get_mock_prediction(key, features)
                    predictions[key + '_percent'] = get_mock_prediction(key + '_percent', features)
            else:
                predictions[key]              = get_mock_prediction(key, features)
                predictions[key + '_percent'] = get_mock_prediction(key + '_percent', features)

        print(json.dumps({"success": True, "predictions": predictions}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    main()