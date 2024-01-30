from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class AnalysisCreationInput(BaseModel):
    rawFile: str
    reactionDb: str
    config: TaskConfig

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


class TaskConfig(BaseModel):
    maxResponseThreshold: float
    minResponseRatio: float
    ms2SimilarityThreshold: float
    mzErrorThreshold: float
    rtTimeWindow: float
    experimentGroups: list[Experiment]

    class Config:
        arbitrary_types_allowed = True


class Task(BaseModel):
    id: str
    reactionDatabase: ReactionDatabase
    rawFile: RawFile

    class Config:
        arbitrary_types_allowed = True
