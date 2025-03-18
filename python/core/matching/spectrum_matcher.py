from typing import List, Dict, Optional, Tuple
import numpy as np
from dataclasses import dataclass
from matchms import Spectrum
from core.models.compound_reference import *
from core.validation.ms2_validator import MS2PatternValidator

@dataclass
class MatchResult:
    """匹配结果类"""
    compound_id: str
    skeleton_type: CompoundSubclass
    ms1_score: float
    ms2_score: float
    overall_score: float
    matched_fragments: List[FragmentPattern]
    diagnostic_matches: List[str]
    confidence_level: str  # High/Medium/Low
    details: Dict

class SpectrumMatcher:
    def __init__(
        self,
        ms1_tolerance: float = 0.01,
        ms2_tolerance: float = 0.02,
        min_ms2_score: float = 0.3
    ):
        self.ms1_tolerance = ms1_tolerance
        self.ms2_validator = MS2PatternValidator(mz_tolerance=ms2_tolerance)
        self.min_ms2_score = min_ms2_score

    def match_compound(
        self,
        ms1_mz: float,
        ms2_spectrum: Spectrum,
        reference_compounds: List[ReferenceCompound]
    ) -> List[MatchResult]:
        """匹配化合物的主要方法
        
        Args:
            ms1_mz: MS1质谱中的m/z值
            ms2_spectrum: MS2质谱图
            reference_compounds: 参考化合物库
            
        Returns:
            List[MatchResult]: 排序后的匹配结果列表
        """
        matches = []
        
        # 1. 首先基于MS1进行初筛
        potential_matches = self._filter_by_ms1(ms1_mz, reference_compounds)
        
        # 2. 对每个可能的匹配进行MS2验证
        for compound in potential_matches:
            # 验证骨架模式
            skeleton_results = self.ms2_validator.validate_skeleton_pattern(
                ms2_spectrum,
                compound.skeleton_pattern,
                ms1_mz
            )
            
            # 验证具体的MS2碎片
            fragment_results = self._validate_ms2_fragments(
                ms2_spectrum,
                compound.ms2_fragments
            )
            
            # 计算总体匹配分数
            ms1_score = self._calculate_ms1_score(ms1_mz, compound.mz)
            ms2_score = self._calculate_ms2_score(skeleton_results, fragment_results)
            overall_score = self._calculate_overall_score(ms1_score, ms2_score)
            
            # 确定置信度级别
            confidence_level = self._determine_confidence_level(
                ms1_score, ms2_score, skeleton_results
            )
            
            if overall_score >= self.min_ms2_score:
                matches.append(MatchResult(
                    compound_id=compound.name,
                    skeleton_type=compound.subclass,
                    ms1_score=ms1_score,
                    ms2_score=ms2_score,
                    overall_score=overall_score,
                    matched_fragments=fragment_results["matched_fragments"],
                    diagnostic_matches=skeleton_results["matched_diagnostic_fragments"],
                    confidence_level=confidence_level,
                    details={
                        "skeleton_results": skeleton_results,
                        "fragment_results": fragment_results
                    }
                ))
        
        # 按总分排序
        matches.sort(key=lambda x: x.overall_score, reverse=True)
        return matches

    def _filter_by_ms1(
        self,
        ms1_mz: float,
        reference_compounds: List[ReferenceCompound]
    ) -> List[ReferenceCompound]:
        """基于MS1 m/z值进行初步筛选"""
        return [
            compound for compound in reference_compounds
            if abs(compound.mz - ms1_mz) <= self.ms1_tolerance
        ]

    def _validate_ms2_fragments(
        self,
        spectrum: Spectrum,
        reference_fragments: List[FragmentPattern]
    ) -> Dict:
        """验证MS2碎片匹配情况"""
        matched_fragments = []
        matched_intensities = []
        
        for ref_fragment in reference_fragments:
            # 在实验谱图中查找匹配峰
            matched_peak = self._find_matching_peak(
                spectrum,
                ref_fragment.mz
            )
            
            if matched_peak is not None:
                matched_fragments.append(ref_fragment)
                matched_intensities.append(matched_peak[1])  # 强度值
        
        return {
            "matched_fragments": matched_fragments,
            "matched_intensities": matched_intensities,
            "match_ratio": len(matched_fragments) / len(reference_fragments)
        }

    def _find_matching_peak(
        self,
        spectrum: Spectrum,
        target_mz: float
    ) -> Optional[Tuple[float, float]]:
        """在质谱图中查找匹配的峰"""
        for i, mz in enumerate(spectrum.peaks.mz):
            if abs(mz - target_mz) <= self.ms2_validator.mz_tolerance:
                return (mz, spectrum.peaks.intensities[i])
        return None

    def _calculate_ms1_score(self, observed_mz: float, reference_mz: float) -> float:
        """计算MS1匹配分数"""
        error_ppm = abs(observed_mz - reference_mz) / reference_mz * 1e6
        return 1.0 - min(error_ppm / 10.0, 1.0)  # 10 ppm作为标准化因子

    def _calculate_ms2_score(
        self,
        skeleton_results: Dict,
        fragment_results: Dict
    ) -> float:
        """计算MS2匹配总分"""
        weights = {
            "skeleton": 0.6,
            "fragments": 0.4
        }
        
        skeleton_score = skeleton_results["overall_score"]
        fragment_score = fragment_results["match_ratio"]
        
        return (
            weights["skeleton"] * skeleton_score +
            weights["fragments"] * fragment_score
        )

    def _calculate_overall_score(self, ms1_score: float, ms2_score: float) -> float:
        """计算总体匹配分数"""
        weights = {
            "ms1": 0.3,
            "ms2": 0.7
        }
        return weights["ms1"] * ms1_score + weights["ms2"] * ms2_score

    def _determine_confidence_level(
        self,
        ms1_score: float,
        ms2_score: float,
        skeleton_results: Dict
    ) -> str:
        """确定匹配结果的置信度级别"""
        if (ms1_score >= 0.9 and ms2_score >= 0.8 and
            len(skeleton_results["matched_diagnostic_fragments"]) >= 2):
            return "High"
        elif (ms1_score >= 0.8 and ms2_score >= 0.6 and
              len(skeleton_results["matched_diagnostic_fragments"]) >= 1):
            return "Medium"
        else:
            return "Low" 