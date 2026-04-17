from sentence_transformers import SentenceTransformer, LoggingHandler, models, losses
from sentence_transformers.datasets import DenoisingAutoEncoderDataset
from torch.utils.data import DataLoader
import logging
import os
import nltk
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)

# Configure logging
logging.basicConfig(format='%(asctime)s - %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    level=logging.INFO,
                    handlers=[LoggingHandler()])

def train():
    # 1. Load the base model
    model_name = 'sentence-transformers/all-MiniLM-L6-v2'
    word_embedding_model = models.Transformer(model_name)
    pooling_model = models.Pooling(word_embedding_model.get_word_embedding_dimension())
    model = SentenceTransformer(modules=[word_embedding_model, pooling_model])

    # 2. Load the training corpus
    corpus_path = 'processed/training_corpus.txt'
    if not os.path.exists(corpus_path):
        print(f"Error: {corpus_path} not found. Run preprocess_data.py first.")
        return

    with open(corpus_path, 'r', encoding='utf-8') as f:
        train_sentences = [line.strip() for line in f if line.strip()]

    print(f"Loaded {len(train_sentences)} sentences for training.")

    # 3. Create TSDAE dataset
    # TSDAE adds noise to sentences and the model learns to reconstruct the original sentence
    train_dataset = DenoisingAutoEncoderDataset(train_sentences)
    train_dataloader = DataLoader(train_dataset, batch_size=8, shuffle=True)

    # 4. Define the loss function
    train_loss = losses.DenoisingAutoEncoderLoss(model, decoder_name_or_path=model_name, tie_encoder_decoder=False)

    # 5. Fine-tune the model
    output_path = 'models/resume_embeddings_tsdae'
    num_epochs = 1  # 1 epoch is usually enough for domain adaptation with TSDAE on small datasets
    
    print("Starting training (TSDAE)... This might take some time on CPU.")
    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        epochs=num_epochs,
        weight_decay=0,
        scheduler='constantlr',
        optimizer_params={'lr': 3e-5},
        show_progress_bar=True,
        output_path=output_path
    )

    print(f"Training complete. Model saved to {output_path}")

if __name__ == "__main__":
    train()
