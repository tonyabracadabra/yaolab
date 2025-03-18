from core.matching.spectrum_matcher import SpectrumMatcher
from core.models.compound_reference import *
from pathlib import Path
import pandas as pd
import logging

class CompoundIdentifier:
    def __init__(
        self,
        reference_compounds: List[ReferenceCompound],
        ms1_tolerance: float = 0.01,
        ms2_tolerance: float = 0.02
    ):
        self.matcher = SpectrumMatcher(
            ms1_tolerance=ms1_tolerance,
            ms2_tolerance=ms2_tolerance
        )
        self.reference_compounds = reference_compounds
        self._setup_logging()

    def _setup_logging(self):
        """设置日志记录"""
        self.logger = logging.getLogger("CompoundIdentifier")
        self.logger.setLevel(logging.INFO)
        
        # 创建日志文件
        log_dir = Path("python/log")
        log_dir.mkdir(parents=True, exist_ok=True)
        
        handler = logging.FileHandler(log_dir / "compound_identification.log")
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(handler)

    def identify_compounds(
        self,
        ms1_data: pd.DataFrame,
        ms2_spectra: List[Spectrum]
    ) -> pd.DataFrame:
        """识别化合物
        
        Args:
            ms1_data: MS1数据DataFrame
            ms2_spectra: MS2谱图列表
            
        Returns:
            DataFrame包含识别结果
        """
        results = []
        
        # 创建MS2谱图查找字典
        ms2_dict = {str(spec.metadata.get("scan_number")): spec for spec in ms2_spectra}
        
        for _, row in ms1_data.iterrows():
            ms1_mz = row["mz"]
            scan_number = str(row["scan_number"])
            
            if scan_number not in ms2_dict:
                self.logger.warning(f"No MS2 spectrum found for scan {scan_number}")
                continue
                
            ms2_spectrum = ms2_dict[scan_number]
            
            # 进行匹配
            matches = self.matcher.match_compound(
                ms1_mz,
                ms2_spectrum,
                self.reference_compounds
            )
            
            if matches:
                best_match = matches[0]  # 取最佳匹配
                results.append({
                    "scan_number": scan_number,
                    "observed_mz": ms1_mz,
                    "rt": row.get("rt", None),
                    "matched_compound": best_match.compound_id,
                    "skeleton_type": best_match.skeleton_type,
                    "ms1_score": best_match.ms1_score,
                    "ms2_score": best_match.ms2_score,
                    "overall_score": best_match.overall_score,
                    "confidence": best_match.confidence_level,
                    "diagnostic_fragments": len(best_match.diagnostic_matches),
                    "total_matched_fragments": len(best_match.matched_fragments)
                })
                
                self.logger.info(
                    f"Scan {scan_number}: Matched {best_match.compound_id} "
                    f"(Score: {best_match.overall_score:.3f}, "
                    f"Confidence: {best_match.confidence_level})"
                )
            else:
                self.logger.info(f"No matches found for scan {scan_number}")
        
        return pd.DataFrame(results)

    def export_results(self, results_df: pd.DataFrame, output_path: Path):
        """导出结果到Excel文件，包含详细信息"""
        with pd.ExcelWriter(output_path) as writer:
            # 主要结果表
            results_df.to_excel(writer, sheet_name="Identifications", index=False)
            
            # 按骨架类型统计
            skeleton_stats = results_df["skeleton_type"].value_counts().reset_index()
            skeleton_stats.columns = ["Skeleton Type", "Count"]
            skeleton_stats.to_excel(writer, sheet_name="Skeleton Statistics", index=False)
            
            # 按置信度级别统计
            confidence_stats = results_df["confidence"].value_counts().reset_index()
            confidence_stats.columns = ["Confidence Level", "Count"]
            confidence_stats.to_excel(writer, sheet_name="Confidence Statistics", index=False) 