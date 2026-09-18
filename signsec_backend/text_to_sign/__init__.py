"""
Model fallback for text -> sign conversion.

Conversion flow
---------------
1. Current implementation (cwasa-runtime/avatarnew.html): each caption word is
   looked up in the sign dictionary (SignFiles/sigmlData.json); a word that is
   not there is fingerspelled letter by letter.
2. Every dictionary miss counts as a failure of that implementation. After
   MODEL_FALLBACK_AFTER_FAILURES misses in a row, the avatar page also sends
   each missed word to POST /api/text-to-sign (routes/text_to_sign.py). A
   dictionary hit resets the count.
3. The endpoint runs ModelFallbackChain (fallback.py), which tries the trained
   models in order until one returns glosses that are in the dictionary:
       Transformer encoder-decoder  (models/transformer.py)
    -> LSTM Seq2Seq + Attention      (models/lstm_attention.py)
    -> Vanilla RNN Seq2Seq           (models/rnn_seq2seq.py)
4. The avatar signs the returned glosses from the dictionary. If no model is
   trained, installed or able to help, it fingerspells the word as before.

Every model maps English tokens (tokenization.py) to a sequence of sign
glosses drawn from the dictionary (sign_dictionary.py), and is trained with
train.py into <checkpoint dir>/<model>.pt (checkpoints.py).

Only this module and fallback.py are imported by the web app; everything
that needs PyTorch loads on first use, so the backend runs without it.
"""
