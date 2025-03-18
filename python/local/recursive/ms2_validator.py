#!/usr/bin/env python
"""
MS2 Validator for Seed Metabolite Selection

这个脚本用于演示如何使用MS1和MS2联合信息筛选母核化合物，
特别适用于黄酮类、三萜皂苷类、生物碱类等次级代谢产物的分析。
"""

import argparse
import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd
from matchms.importing import load_from_mgf
from matchms.Spectrum import Spectrum

# Add python directory to Python path
current_dir = Path(__file__).resolve().parent
python_dir = current_dir.parent
sys.path.append(str(python_dir))

from core.preprocess import preprocess_targeted_ions_file
from core.models.analysis import MSTool
from core.recursive.run import RecursiveAnalysisConfig, RecursiveAnalyzer
from core.utils.constants import TargetIonsColumn

# 定义列名映射
COLUMN_MAPPING = {
    'Precursor m/z': 'mz',  # 将'Precursor m/z'映射到'mz'
    'Peak ID': 'id',  # 将'Peak ID'映射到'id'
    'RT (min)': 'rt',  # 将'RT (min)'映射到'rt'
    'Height': 'height',  # 将'Height'映射到'height'
    'Area': 'area'  # 将'Area'映射到'area'
}

# 配置日志
def setup_logging():
    log_dir = Path("python/log")
    log_dir.mkdir(parents=True, exist_ok=True)
    
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # 控制台输出
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(
        "[%(asctime)s] %(levelname)-8s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    ))
    logger.addHandler(console_handler)
    
    # 文件输出
    file_handler = logging.FileHandler(log_dir / "ms2_validator.log")
    file_handler.setFormatter(logging.Formatter(
        "[%(asctime)s] %(levelname)-8s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    ))
    logger.addHandler(file_handler)
    
    return logger


def parse_ms2_peaks(peaks_str: str) -> List[Dict[str, float]]:
    """解析MS2峰信息，格式：mz1:intensity1 mz2:intensity2 ...
    
    Args:
        peaks_str: 峰信息字符串，如: "120.0807:999 166.0856:481 121.084:73"
        
    Returns:
        解析后的峰列表，格式: [{"mz": mz1, "intensity": intensity1}, ...]
    """
    peaks = []
    for peak_str in peaks_str.split():
        parts = peak_str.strip().split(":")
        if len(parts) == 2:
            try:
                mz = float(parts[0])
                intensity = float(parts[1])
                peaks.append({"mz": mz, "intensity": intensity})
            except ValueError:
                continue
    
    # 按强度降序排序
    peaks = sorted(peaks, key=lambda x: x["intensity"], reverse=True)
    return peaks


def load_ms1_data(file_path: Path) -> pd.DataFrame:
    """加载MS1数据
    
    Args:
        file_path: MS1数据文件路径
        
    Returns:
        处理后的DataFrame，包含必要的列
    """
    try:
        # 直接读取文本文件
        ms1_df = pd.read_csv(file_path, sep='\t')
        
        # 重命名列
        ms1_df = ms1_df.rename(columns=COLUMN_MAPPING)
        
        # 确保必要的列存在
        required_columns = ['mz', 'id']
        missing_columns = [col for col in required_columns if col not in ms1_df.columns]
        if missing_columns:
            raise KeyError(f"缺少必要的列: {', '.join(missing_columns)}")
        
        # 转换ID列为字符串类型
        ms1_df['id'] = ms1_df['id'].astype(str)
        
        return ms1_df
        
    except Exception as e:
        logging.error(f"加载MS1数据失败: {str(e)}")
        return pd.DataFrame()


async def validate_seed_metabolites(
    ms1_file: Path, 
    ms2_file: Path, 
    parent_mz: float,
    parent_ms2_peaks: List[Dict[str, float]],
    ms2_match_tolerance: float = 0.02,
    ms1_tolerance: float = 0.01,
    min_ms2_matched_peaks: int = 2,
    ms2_similarity_threshold: float = 0.3
):
    """使用MS1和MS2联合信息验证种子代谢物
    
    Args:
        ms1_file: MS1数据文件路径
        ms2_file: MS2谱图文件路径
        parent_mz: 母核的m/z值
        parent_ms2_peaks: 母核MS2峰列表
        ms2_match_tolerance: MS2匹配容差
        ms1_tolerance: MS1匹配容差
        min_ms2_matched_peaks: 最小匹配峰数
        ms2_similarity_threshold: MS2相似度阈值
    """
    logger = logging.getLogger()
    
    # 加载MS2谱图
    logger.info(f"加载MS2谱图: {ms2_file}")
    ms2_spectra = list(load_from_mgf(str(ms2_file)))
    logger.info(f"加载了 {len(ms2_spectra)} 个MS2谱图")
    
    # 加载MS1数据
    logger.info(f"加载MS1数据: {ms1_file}")
    ms1_df = load_ms1_data(ms1_file)
    if ms1_df.empty:
        logger.error("MS1数据加载失败，无法继续分析")
        return []
    logger.info(f"加载了 {len(ms1_df)} 条MS1特征")
    
    # 创建父离子MS2峰字典
    parent_ms2_peaks_dict = {parent_mz: parent_ms2_peaks}
    
    # 创建配置对象
    config = RecursiveAnalysisConfig(
        parent_mz_list=[parent_mz],
        parent_mz_error=ms1_tolerance,
        enable_ms2_validation=True,
        parent_ms2_peaks=parent_ms2_peaks_dict,
        ms2_match_tolerance=ms2_match_tolerance,
        min_ms2_matched_peaks=min_ms2_matched_peaks,
        ms2_similarity_threshold=ms2_similarity_threshold
    )
    
    # 初始化分析器
    analyzer = RecursiveAnalyzer(
        config=config,
        ms2_spectra=ms2_spectra,
        ms1_df=ms1_df
    )
    
    # 选择种子代谢物
    logger.info("开始筛选种子代谢物...")
    seed_metabolites = analyzer._select_seed_metabolites()
    
    # 输出结果
    if seed_metabolites:
        logger.info(f"找到 {len(seed_metabolites)} 个通过MS2验证的种子代谢物")
        
        # 获取选中的代谢物的详细信息
        seed_info = []
        for seed_id in seed_metabolites:
            if seed_id in analyzer.id_to_index:
                idx = analyzer.id_to_index[seed_id]
                mz = analyzer.mz_array[idx]
                seed_info.append({
                    "id": seed_id,
                    "mz": float(mz),
                    "delta_da": float(abs(mz - parent_mz))
                })
        
        # 打印详细信息
        for i, info in enumerate(seed_info):
            logger.info(f"  种子代谢物 {i+1}: ID={info['id']}, m/z={info['mz']:.4f}, 差值={info['delta_da']:.4f} Da")
        
        # 检查输出目录
        log_dir = Path("python/log")
        verified_seeds_file = log_dir / f"verified_seeds_{parent_mz:.4f}.json"
        
        # 保存验证结果
        with open(verified_seeds_file, "w") as f:
            json.dump({
                "parent_mz": parent_mz,
                "ms2_peaks": parent_ms2_peaks,
                "verified_seeds": seed_info,
                "validation_params": {
                    "ms1_tolerance": ms1_tolerance,
                    "ms2_match_tolerance": ms2_match_tolerance,
                    "min_ms2_matched_peaks": min_ms2_matched_peaks,
                    "ms2_similarity_threshold": ms2_similarity_threshold
                }
            }, f, indent=2)
        
        logger.info(f"验证结果已保存到: {verified_seeds_file}")
        
        # 返回种子代谢物
        return seed_metabolites
    else:
        logger.warning("未找到符合条件的种子代谢物")
        return []


def main():
    parser = argparse.ArgumentParser(
        description="使用MS1和MS2联合信息筛选母核化合物"
    )
    parser.add_argument("--ms1", type=str, required=False,
                      default="/Users/aylin/yaolab/python/asset/test/LAJ01-POS.txt",
                      help="MS1数据文件路径")
    parser.add_argument("--ms2", type=str, required=False,
                      default="/Users/aylin/yaolab/python/asset/test/Mgf_LAJ01-POS_fixed.mgf",
                      help="MS2谱图文件路径")
    parser.add_argument("--parent-mz", type=float, required=True,
                      help="母核的m/z值")
    parser.add_argument("--parent-ms2-peaks", type=str, required=True,
                      help="母核的MS2峰列表，格式: 'mz1:intensity1 mz2:intensity2 ...'")
    parser.add_argument("--ms1-tolerance", type=float, default=0.01,
                      help="MS1匹配容差 (默认: 0.01 Da)")
    parser.add_argument("--ms2-tolerance", type=float, default=0.02,
                      help="MS2匹配容差 (默认: 0.02 Da)")
    parser.add_argument("--min-peaks", type=int, default=2,
                      help="最小匹配峰数 (默认: 2)")
    parser.add_argument("--similarity", type=float, default=0.3,
                      help="MS2相似度阈值 (默认: 0.3)")
    
    args = parser.parse_args()
    
    # 设置日志
    logger = setup_logging()
    
    # 解析MS2峰信息
    parent_ms2_peaks = parse_ms2_peaks(args.parent_ms2_peaks)
    
    if not parent_ms2_peaks:
        logger.error("无法解析MS2峰信息。请使用正确格式: 'mz1:intensity1 mz2:intensity2 ...'")
        sys.exit(1)
    
    logger.info(f"母核 m/z: {args.parent_mz}, 提供了 {len(parent_ms2_peaks)} 个MS2峰")
    for i, peak in enumerate(parent_ms2_peaks[:5]):  # 只显示前5个峰
        logger.info(f"  峰 {i+1}: m/z={peak['mz']}, 强度={peak['intensity']}")
    
    if len(parent_ms2_peaks) > 5:
        logger.info(f"  ... 以及另外 {len(parent_ms2_peaks) - 5} 个峰")
    
    # 运行验证
    asyncio.run(validate_seed_metabolites(
        ms1_file=Path(args.ms1),
        ms2_file=Path(args.ms2),
        parent_mz=args.parent_mz,
        parent_ms2_peaks=parent_ms2_peaks,
        ms2_match_tolerance=args.ms2_tolerance,
        ms1_tolerance=args.ms1_tolerance,
        min_ms2_matched_peaks=args.min_peaks,
        ms2_similarity_threshold=args.similarity
    ))


if __name__ == "__main__":
    main() 