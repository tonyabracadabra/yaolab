from rdkit import Chem
from rdkit.Chem import Draw

# 读取SMILES字符串
smiles = "O=C1C=2C(O)=CC(O)=CC2OC(C3=CC=C4OC(CO)C(OC4=C3)C5=CC=C(O)C(OC)=C5)C1O"

# 将SMILES字符串转换为RDKit分子对象
mol = Chem.MolFromSmiles(smiles)

# 生成分子结构图
img = Draw.MolToImage(mol, size=(300, 300))

# 显示图片
img.show()
