from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from datetime import datetime, timedelta

# Python函数定义省略...

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2023, 1, 1),
    'email': ['your_email@example.com'],
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'metabolomics_analysis_workflow',
    default_args=default_args,
    description='An Airflow DAG for metabolomics data analysis',
    schedule_interval=timedelta(days=1),
)

# 定义任务
extract_data = PythonOperator(
    task_id='extract_data',
    python_callable=step_extract_data,  # 定义相应的Python函数
    dag=dag,
)

generate_targeted_ions_list = PythonOperator(
    task_id='generate_targeted_ions_list',
    python_callable=step_targeted_ions_list,  # 定义相应的Python函数
    dag=dag,
)

generate_nodes = PythonOperator(
    task_id='generate_nodes',
    python_callable=step_generate_nodes,  # 定义相应的Python函数
    dag=dag,
)

ms1_data_processing = PythonOperator(
    task_id='ms1_data_processing',
    python_callable=step_ms1_data_processing,  # 定义相应的Python函数
    dag=dag,
)

ms2_data_processing = PythonOperator(
    task_id='ms2_data_processing',
    python_callable=step_ms2_data_processing,  # 定义相应的Python函数
    dag=dag,
)

amz_data_processing = PythonOperator(
    task_id='amz_data_processing',
    python_callable=step_amz_data_processing,  # 定义相应的Python函数
    dag=dag,
)

generate_edges = PythonOperator(
    task_id='generate_edges',
    python_callable=step_generate_edges,  # 定义相应的Python函数
    dag=dag,
)

network_visualization = PythonOperator(
    task_id='network_visualization',
    python_callable=step_network_visualization,  # 定义相应的Python函数
    dag=dag,
)

# 定义任务依赖
extract_data >> generate_targeted_ions_list >> [generate_nodes, ms1_data_processing, ms2_data_processing]
ms1_data_processing >> amz_data_processing
ms2_data_processing >> amz_data_processing
amz_data_processing >> generate_edges >> network_visualization
