from __future__ import annotations

from enum import Enum
from typing import Optional, Union

from pydantic import BaseModel


class RawFile:
    name: str
    file: str


class ReactionDatabase(BaseModel):
    user: str
    name: str
    file: str
    customReactions: list[CustomReaction]


class Experiment(BaseModel):
    name: str
    sampleGroups: list[str]
    blankGroups: list[str]


class CustomReaction(BaseModel):
    formulaChange: str
    reactionDescription: str


class TaskConfig(BaseModel):
    maxResponseThreshold: float
    minResponseRatio: float
    ms2SimilarityThreshold: float
    mzErrorThreshold: float
    rtTimeWindow: float
    experimentGroups: list[Experiment]


class TaskInput(BaseModel):
    rawFile: str
    reactionDatabase: str
    config: TaskConfig


class Task(BaseModel):
    id: str
    reactionDatabase: ReactionDatabase
    rawFile: RawFile
