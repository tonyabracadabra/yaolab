from setuptools import find_packages, setup

setup(
    name="meta_analysis",
    packages=find_packages(exclude=["meta_analysis_tests"]),
    install_requires=["dagster", "dagster-cloud"],
    extras_require={"dev": ["dagster-webserver", "pytest"]},
)
