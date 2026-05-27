import torch
import torch.nn as nn

class ConvBlock(nn.Module):
    def __init__(self, in_channels, out_channels):
        super(ConvBlock, self).__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )
    
    def forward(self, x):
        return self.block(x)

class UNetPlusPlus(nn.Module):
    """U-Net++ for vessel segmentation"""
    def __init__(self, in_channels=3, out_channels=1):
        super(UNetPlusPlus, self).__init__()
        
        filters = [32, 64, 128, 256, 512]
        
        # Encoder
        self.enc0 = ConvBlock(in_channels, filters[0])
        self.enc1 = ConvBlock(filters[0], filters[1])
        self.enc2 = ConvBlock(filters[1], filters[2])
        self.enc3 = ConvBlock(filters[2], filters[3])
        self.enc4 = ConvBlock(filters[3], filters[4])
        
        self.pool = nn.MaxPool2d(2)
        self.up = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
        
        # Decoder
        self.x_0_1 = ConvBlock(filters[0] + filters[1], filters[0])
        self.x_1_1 = ConvBlock(filters[1] + filters[2], filters[1])
        self.x_2_1 = ConvBlock(filters[2] + filters[3], filters[2])
        self.x_3_1 = ConvBlock(filters[3] + filters[4], filters[3])
        
        self.x_0_2 = ConvBlock(filters[0]*2 + filters[1], filters[0])
        self.x_1_2 = ConvBlock(filters[1]*2 + filters[2], filters[1])
        self.x_2_2 = ConvBlock(filters[2]*2 + filters[3], filters[2])
        
        self.x_0_3 = ConvBlock(filters[0]*3 + filters[1], filters[0])
        self.x_1_3 = ConvBlock(filters[1]*3 + filters[2], filters[1])
        
        self.x_0_4 = ConvBlock(filters[0]*4 + filters[1], filters[0])
        
        self.final = nn.Conv2d(filters[0], out_channels, 1)
    
    def forward(self, x):
        x0_0 = self.enc0(x)
        x1_0 = self.enc1(self.pool(x0_0))
        x2_0 = self.enc2(self.pool(x1_0))
        x3_0 = self.enc3(self.pool(x2_0))
        x4_0 = self.enc4(self.pool(x3_0))
        
        x0_1 = self.x_0_1(torch.cat([x0_0, self.up(x1_0)], 1))
        x1_1 = self.x_1_1(torch.cat([x1_0, self.up(x2_0)], 1))
        x2_1 = self.x_2_1(torch.cat([x2_0, self.up(x3_0)], 1))
        x3_1 = self.x_3_1(torch.cat([x3_0, self.up(x4_0)], 1))
        
        x0_2 = self.x_0_2(torch.cat([x0_0, x0_1, self.up(x1_1)], 1))
        x1_2 = self.x_1_2(torch.cat([x1_0, x1_1, self.up(x2_1)], 1))
        x2_2 = self.x_2_2(torch.cat([x2_0, x2_1, self.up(x3_1)], 1))
        
        x0_3 = self.x_0_3(torch.cat([x0_0, x0_1, x0_2, self.up(x1_2)], 1))
        x1_3 = self.x_1_3(torch.cat([x1_0, x1_1, x1_2, self.up(x2_2)], 1))
        
        x0_4 = self.x_0_4(torch.cat([x0_0, x0_1, x0_2, x0_3, self.up(x1_3)], 1))
        
        output = self.final(x0_4)
        return output