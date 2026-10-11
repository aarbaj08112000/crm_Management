pipeline {
    agent any
    stages {
        stage('Deploy CRM') {
            steps {
                sh 'bash /var/www/html/sh-script/crm.sh'
            }
        }
    }
}
