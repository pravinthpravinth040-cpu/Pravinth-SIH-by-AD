import torch
import torch.nn as nn
import torchvision.models as models

def get_resnet18_classifier(pretrained: bool = False) -> nn.Module:
    """
    Constructs ResNet18 architecture for binary SAR oil spill classification.
    Replaces final fully-connected (fc) layer with a single scalar logit output.
    Positive logits correlate to oil spill presence, negative to clean ocean water.
    """
    weights = models.ResNet18_Weights.DEFAULT if pretrained else None
    model = models.resnet18(weights=weights)
    
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, 1)
    
    return model

if __name__ == "__main__":
    m = get_resnet18_classifier(pretrained=False)
    x = torch.randn(2, 3, 224, 224)
    out = m(x)
    print("Model initialized successfully. Output shape:", out.shape)
