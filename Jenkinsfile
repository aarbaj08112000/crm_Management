pipeline {
    agent any
    stages {
        stage('Deploy CRM') {
            steps {
                sh 'sudo /var/www/html/sh-script/crm.sh'
            }
        }
    }
}