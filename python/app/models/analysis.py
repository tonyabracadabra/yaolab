from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Extra


class AnalysisStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    FAILED = "failed"
    COMPLETE = "complete"


class AnalysisTriggerInput(BaseModel):
    id: str


class Experiment(BaseModel):
    name: str
    sampleGroups: list[str]
    blankGroups: list[str]


class AnalysisConfig(BaseModel):
    minSignalThreshold: float
    signalEnrichmentFactor: float
    ms2SimilarityThreshold: float
    mzErrorThreshold: float
    rtTimeWindow: float
    experiments: list[Experiment]
    correlationThreshold: float

    class Config:
        arbitrary_types_allowed = True


class AnalysisCreationInput(BaseModel):
    rawFile: str
    reactionDb: str
    config: AnalysisConfig

    class Config:
        arbitrary_types_allowed = True


class MSTool(str, Enum):
    MZmine3 = "MZmine3"
    MDial = "MDial"


class Reaction(BaseModel):
    formulaChange: str
    description: str
    massDiff: float


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


class Edge(BaseModel):
    id1: str
    id2: str
    value: float
    correlation: float
    rtDiff: float
    mzDiff: float
    matchedMzDiff: float
    matchedFormulaChange: float
    matchedReactionDesc: float
    redundantData: float
    modCos: float

    class Config:
        arbitrary_types_allowed = True


class Analysis(BaseModel):
    reactionDb: ReactionDatabase | Literal["default"]
    rawFile: RawFile
    config: AnalysisConfig

    class Config:
        arbitrary_types_allowed = True
        extra = Extra.ignore
