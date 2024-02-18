from __future__ import annotations

from enum import Enum
from typing import Literal

from app.utils.constants import AutoValueEnumMeta
from pydantic import BaseModel, Extra


class AnalysisTriggerInput(BaseModel):
    id: str


class BioSample(BaseModel):
    name: str
    sample: list[str]
    blank: list[str]


class DrugSample(BaseModel):
    name: str
    groups: list[str]


class AnalysisConfig(BaseModel):
    minSignalThreshold: float
    signalEnrichmentFactor: float
    ms2SimilarityThreshold: float
    mzErrorThreshold: float
    rtTimeWindow: float
    correlationThreshold: float
    bioSamples: list[BioSample]
    drugSample: DrugSample

    class Config:
        arbitrary_types_allowed = True


class AnalysisCreationInput(BaseModel):
    rawFile: str
    reactionDb: str
    config: AnalysisConfig

    class Config:
        arbitrary_types_allowed = True


class AnalysisStatus(AutoValueEnumMeta):
    RUNNING = "running"
    FAILED = "failed"
    COMPLETE = "complete"


class MSTool(AutoValueEnumMeta):
    MZmine3 = "MZmine3"
    MDial = "MDial"


class Reaction(BaseModel):
    formulaChange: str
    description: str
    mzDiff: float


class ReactionDatabase(BaseModel):
    name: str
    reactions: list[Reaction]

    class Config:
        arbitrary_types_allowed = True


class RawFile(BaseModel):
    name: str
    tool: MSTool
    mgf: str
    targetedIons: str
    sampleCols: list[str]

    class Config:
        arbitrary_types_allowed = True


class Analysis(BaseModel):
    reactionDb: ReactionDatabase | Literal["default"]
    rawFile: RawFile
    config: AnalysisConfig

    class Config:
        arbitrary_types_allowed = True
        extra = Extra.ignore
