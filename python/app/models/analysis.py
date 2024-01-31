from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Extra


class AnalysisCreationInput(BaseModel):
    rawFile: str
    reactionDb: str
    config: AnalysisConfig

    class Config:
        arbitrary_types_allowed = True


class MSTool(str, Enum):
    MZine = "MZine"
    MDial = "MDial"


class ReactionDatabase(BaseModel):
    name: str
    file: str
    customReactions: list[CustomReaction]

    class Config:
        arbitrary_types_allowed = True


class CustomReaction(BaseModel):
    formula: str
    description: str
    mass: float


class RawFile(BaseModel):
    name: str
    tool: MSTool
    mgf: str
    targetedIons: str
    sampleColumns: list[str]

    class Config:
        arbitrary_types_allowed = True


class Experiment(BaseModel):
    name: str
    sampleGroups: list[str]
    blankGroups: list[str]


class AnalysisConfig(BaseModel):
    maxResponseThreshold: float
    minResponseRatio: float
    ms2SimilarityThreshold: float
    mzErrorThreshold: float
    rtTimeWindow: float
    experimentGroups: list[Experiment]

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
    reactionDb: ReactionDatabase
    rawFile: RawFile
    config: AnalysisConfig

    class Config:
        arbitrary_types_allowed = True
        extra = Extra.ignore


class AnalysisStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    FAILED = "failed"
    COMPLETED = "completed"


class AnalysisTriggerInput(BaseModel):
    id: str
